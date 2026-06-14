# Multibot Final Design v1.2

Este documento descreve a arquitetura multibot atual do QChat Bot na v1.2. Ele
cobre a entrada agnostica por provider, o webhook Evolution, o fluxo dinamico
por `BotConfig`, o fluxo legado e as regras de retomada do atendimento.

## Visao geral

A aplicacao atende varios bots na mesma base. Cada bot e descrito por um
`BotConfig` persistido no banco. A resolucao do bot acontece por:

- `webhookToken` no fluxo dinamico do QChat
- `instance` no webhook Evolution
- `companyId` e `whatsappId` no resolver de contexto e no lookup do QChat

O `BotConfig` e convertido em `BotContext`, que e a visao operacional usada no
use case. O `BotContext` carrega somente o que o fluxo de atendimento precisa:
filas de triagem, menus e mensagens.

O `webhookToken` continua sendo uma credencial operacional. Em producao ele deve
ser um valor nao previsivel e precisa ser mascarado em logs e ferramentas
operacionais.

## Modos de operacao

Existem dois modos principais:

- Fluxo legado: `POST /webhook/qchat`
- Fluxo dinamico QChat: `POST /webhook/qchat/:webhookToken`
- Fluxo Evolution: `POST /webhook/evolution`

O fluxo legado preserva o comportamento historico baseado em ENV. O fluxo
dinamico usa configuracao por bot. O fluxo Evolution permite entrada
agnostica por provider.

## Fluxo Evolution

```text
POST /webhook/evolution
      │
      ▼
messages.upsert
      │
      ▼
EvolutionPayloadNormalizer
      │
      ▼
DefaultBotConfigResolver.resolveByMessage({ companyId, whatsappId })
      │
      ▼
BotContextMapper.fromConfig(botConfig)
      │
      ▼
HandleIncomingMessageUseCase.execute(normalizedMessage, context)
```

Pontos principais:

1. A rota aceita apenas eventos `messages.upsert`.
2. O bot e resolvido pela instance Evolution associada ao `BotConfig`.
3. O normalizador gera `NormalizedIncomingMessage` com `conversationId`.
4. O `conversationId` vira a chave principal de correlacao e sessao quando
   existe.
5. O use case recebe `BotContext` e executa o mesmo fluxo de atendimento do
   QChat dinamico.

## Fluxo QChat dinamico

```text
POST /webhook/qchat/:webhookToken
      │
      ▼
QChatPayloadNormalizer
      │
      ▼
DefaultBotConfigResolver.resolveByWebhookToken(webhookToken)
      │
      ▼
BotContextMapper.fromConfig(botConfig)
      │
      ▼
HandleIncomingMessageUseCase.execute(normalizedMessage, context)
```

O fluxo dinamico monta gateways com config explicita:

- `EvolutionMessagingGateway(botConfig.evolution)`
- `QChatTicketTransferGateway(botConfig.qchat)`

Sem config, os gateways mantem fallback por ENV para preservar o fluxo legado.

## Fluxo QChat legado

O webhook legado continua em:

```text
POST /webhook/qchat
```

Neste modo:

- O `QChatPayloadNormalizer` normaliza a entrada.
- O use case e criado sem `BotContext`.
- Os gateways usam `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`,
  `EVOLUTION_INSTANCE`, `QCHAT_API_URL` e `QCHAT_API_TOKEN`.
- As filas, menus e mensagens vem do legado estatico.

Esse comportamento e intencional e nao deve ser removido sem migracao
planejada do bot antigo.

## Normalizacao agnostica

A camada de entrada foi separada por provider:

- `QChatPayloadNormalizer`
- `EvolutionPayloadNormalizer`

Ambos produzem `NormalizedIncomingMessage`. O formato comum inclui:

- `provider`
- `from`
- `body`
- `messageType`
- `conversationId`
- `ticketId`
- `queueId` quando existir
- `buttonId` quando a mensagem vier de acao interativa

O use case nao depende do provider de origem. Ele trabalha com a mensagem
normalizada e com o contexto de bot, quando existe.

## Regras de fila e retomada

### Triagem

Quando existe `BotContext`, a validacao da fila de triagem usa
`context.triageQueueId`. Quando nao existe contexto, o fallback legado continua
usando `this.queues.triageQueueId`.

### Provider Evolution

Mensagens do Evolution nao sao bloqueadas por ausencia de `queueId`. A decisao
de triagem e contextual e nao depende de fila vinda na entrada.

### Provider QChat

O fluxo QChat mantem a validacao atual de triagem por fila quando aplicavel.

### waiting_human

Quando o bot recebe uma entrada em `waiting_human`, o use case consulta o
status do ticket no banco QChat usando o contexto do bot:

- `companyId`
- `whatsappId`
- telefone de origem

Regras:

- Ticket `open` ou `pending` com atendente ativo: a mensagem e ignorada e a
  sessao continua.
- Ticket fechado ou inexistente: a sessao e removida e o bot retoma o fluxo.
- Ticket `pending` com `userId` vazio e `queueId` da triagem: o bot retoma o
  fluxo.
- Ticket `pending` fora da triagem ou com `userId` preenchido: a mensagem e
  ignorada.

Essa regra evita que o bot reabra conversas que ainda estao em atendimento
humano e permite retomada quando o atendimento encerra.

## Resolucao de menu

Quando existe `BotContext`, o menu ativo depende do horario e do estado do
fluxo:

- `main`: horario comercial
- `after_hours`: fora do horario
- `finance`: submenu financeiro

O `DefaultBusinessHoursService` pode ser forcado por
`BUSINESS_HOURS_OVERRIDE` para `business_hours` ou `after_closing`. Isso e usado
em validacao e suporte operacional.

Resumo do comportamento:

- `awaiting_main_menu` usa `main` em horario comercial.
- `awaiting_main_menu` usa `after_hours` fora do horario.
- `awaiting_finance_menu` continua usando `finance`.

## Responsabilidades por camada

### Domain

Define contratos e tipos centrais:

- `BotConfig`
- `BotConfigRepository`
- `ConversationSessionRepository`
- `MessagingGateway`
- `TicketTransferGateway`
- `NormalizedIncomingMessage`
- erros e tipos de menu

### Application

Orquestra as regras de negocio:

- resolver e mapear contexto de bot
- selecionar menu e mensagem
- decidir ignorar, transferir ou salvar sessao
- aplicar regras de horario e retomada
- consultar status de ticket QChat quando necessario

### Infrastructure

Implementa integracoes externas e persistencia:

- `PostgresBotConfigRepository`
- `PostgresConversationSessionRepository`
- `PostgresQChatTicketStatusLookup`
- `EvolutionMessagingGateway`
- `QChatTicketTransferGateway`
- `QChatPayloadNormalizer`
- `EvolutionPayloadNormalizer`

### Presentation

Lida com HTTP:

- registrar rotas Fastify
- resolver bot por token ou instance
- montar use cases
- retornar respostas HTTP
- delegar erros para o handler central

## BotConfig

`BotConfig` representa a configuracao completa do bot.

Campos relevantes:

- `id`
- `name`
- `webhookToken`
- `companyId`
- `whatsappId`
- `active`
- `qchat.apiUrl`
- `qchat.apiToken`
- `evolution.apiUrl`
- `evolution.apiKey`
- `evolution.instance`
- `queues.triageQueueId`
- `queues.supportQueueId`
- `queues.financeQueueId`
- `queues.otherQueueId`
- `businessHours`
- `messages`
- `menus`

No banco, os dados vivem em `bot_configs`, com estruturas compostas em JSONB.

## BotContext

`BotContext` e a visao operacional usada no runtime.

Campos atuais:

- `botId`
- `botName`
- `companyId`
- `whatsappId`
- `triageQueueId`
- `menus`
- `messages`

O contexto habilita o comportamento dinamico. Sem ele, o legado segue ativo.

## Resolvedores

### BotConfigResolver

Metodos atuais:

- `resolveByWebhookToken(webhookToken)`
- `resolveByMessage({ companyId, whatsappId })`

`resolveByWebhookToken` e o caminho principal do QChat dinamico. O resolver por
mensagem e usado no fluxo Evolution.

### BotContextMapper

`BotContextMapper.fromConfig(config)` transforma `BotConfig` em `BotContext`.
Ele nao cria gateways e nao acessa banco.

## Gateways dinamicos

Os gateways aceitam config opcional.

### EvolutionMessagingGateway

Config:

```ts
{
  apiUrl: string;
  apiKey: string;
  instance: string;
}
```

Sem config, o gateway usa:

- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`

### QChatTicketTransferGateway

Config:

```ts
{
  apiUrl: string;
  apiToken: string;
}
```

Sem config, o gateway usa:

- `QCHAT_API_URL`
- `QCHAT_API_TOKEN`

## Coexistencia de bots

Dois bots coexistem porque cada um tem um `webhookToken` e um `BotConfig`
proprio. Exemplo de ambiente de homologacao:

- `qos-prod`
- `qos-test-bot`

Em producao, o esperado e usar tokens nao previsiveis.

## Gestao operacional

Comandos uteis:

```bash
npm run bot:list
npm run bot:show -- <botId>
npm run bot:show -- <companyId>:<whatsappId>
npm run bot:rotate-token -- <botId>
npm run bot:rotate-token -- <companyId>:<whatsappId>
npm run bot:health -- <botId>
npm run bot:health -- <companyId>:<whatsappId>
```

`bot:list` mostra tokens mascarados. `bot:show` exibe o token completo. `bot:rotate-token`
gera um novo token e atualiza o banco. `bot:health` valida resolucao, config e
estado operacional do bot.

## Limites e proximos passos

Pontos ainda intencionais:

- o fluxo legado continua dependente de ENV
- o use case ainda preserva fallback legado para filas e menus estaticos
- a arquitetura atual nao inclui GLPI

Proxima evolucao planejada:

- GLPI como integracao de chamada e acompanhamento

