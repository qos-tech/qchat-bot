# Multibot Final Design v1.1

Este documento descreve o desenho atual da arquitetura multibot do QChat Bot na
v1.1. Ele cobre o fluxo dinamico, o fluxo legado, as responsabilidades das
camadas e os pontos de extensao para novos bots e integracoes.

## Visao Geral

A v1.1 permite que a mesma aplicacao atenda mais de um bot. Cada bot e descrito
por um `BotConfig` persistido no banco de dados. A rota dinamica resolve esse
registro pelo `webhookToken`, cria gateways com as credenciais daquele bot e
executa o fluxo com um `BotContext` derivado do `BotConfig`.

Existem dois modos de operacao:

- Fluxo legado: `/webhook/qchat`, sem `BotContext`, usando configuracoes de ENV.
- Fluxo dinamico: `/webhook/qchat/:webhookToken`, com `BotContext`, usando
  configuracoes de banco.

A compatibilidade do fluxo legado e intencional. Ela permite manter o bot antigo
ativo enquanto novos bots passam a ser criados por configuracao.

## Fluxo da Rota Dinamica

A rota dinamica e:

```text
POST /webhook/qchat/:webhookToken
```

Fluxo atual:

1. O Fastify recebe o payload QChat.
2. A rota extrai `webhookToken` de `request.params`.
3. `DefaultBotConfigResolver.resolveByWebhookToken(webhookToken)` busca um
   `BotConfig` ativo em `bot_configs`.
4. Se nao encontrar bot, a rota responde `404`.
5. `QChatPayloadNormalizer` normaliza o payload recebido.
6. `BotContextMapper.fromConfig(botConfig)` cria o `BotContext`.
7. A rota cria um `HandleIncomingMessageUseCase` dinamico com:
   - `EvolutionMessagingGateway(botConfig.evolution)`
   - `QChatTicketTransferGateway(botConfig.qchat)`
   - repositorio de sessoes Postgres
   - servico de horario comercial
   - `queueConfig` legado ainda injetado como fallback
8. O use case executa `execute(normalizedMessage, context)`.

Quando `context` existe:

- A validacao de fila de triagem usa `context.triageQueueId`.
- Os menus enviados saem de `context.menus`.
- As mensagens de confirmacao saem de `context.messages`.
- As transferencias configuraveis usam os `queueId` definidos nos botoes dos
  menus do bot.
- O envio de menu usa a Evolution instance do bot.
- A transferencia usa URL/token QChat do bot.

## Fluxo da Rota Legada

A rota legada e:

```text
POST /webhook/qchat
```

Fluxo atual:

1. O Fastify recebe o payload QChat.
2. `QChatPayloadNormalizer` normaliza o payload.
3. A rota usa o use case criado por `createHandleIncomingMessageUseCase()`.
4. Esse bootstrap cria gateways sem config explicita:
   - `new EvolutionMessagingGateway()`
   - `new QChatTicketTransferGateway()`
5. Sem config explicita, os gateways usam variaveis de ambiente:
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
   - `EVOLUTION_INSTANCE`
   - `QCHAT_API_URL`
   - `QCHAT_API_TOKEN`
6. O use case executa `execute(normalizedMessage)` sem `BotContext`.

Quando `context` nao existe:

- A fila de triagem vem de `this.queues.triageQueueId`.
- As filas de transferencia vem de `this.queues`.
- Os menus vem dos arquivos estaticos de `application/menus`.
- As mensagens vem dos arquivos estaticos de `application/messages`.

Esse comportamento e o fallback legado e nao deve ser removido sem uma migracao
planejada do bot antigo.

## Responsabilidades por Camada

### Domain

A camada `domain` define contratos e tipos centrais. Ela nao importa
`infrastructure`.

Responsabilidades atuais:

- `BotConfig`: formato de configuracao completa de um bot.
- `BotConfigRepository`: contrato para buscar configuracoes.
- `ConversationSessionRepository`: contrato de sessoes.
- `TicketTransferGateway`: contrato de transferencia QChat.
- `MessagingGateway`: contrato de envio de mensagens.
- Tipos de mensagem normalizada, botoes, erros e intents.

### Application

A camada `application` orquestra regras de negocio e depende de contratos do
dominio.

Responsabilidades atuais:

- Resolver e mapear contexto de bot.
- Selecionar menus e mensagens.
- Converter menu configuravel para payload de botoes.
- Processar mensagens no `HandleIncomingMessageUseCase`.
- Decidir quando ignorar, enviar menu, salvar sessao ou transferir ticket.

### Infrastructure

A camada `infrastructure` implementa contratos externos e persistencia.

Responsabilidades atuais:

- `PostgresBotConfigRepository`: le `bot_configs` e converte linhas para
  `BotConfig`.
- `PostgresConversationSessionRepository`: persiste sessoes de atendimento.
- `EvolutionMessagingGateway`: envia textos e botoes pela Evolution API.
- `QChatTicketTransferGateway`: envia transferencia/mensagem para QChat.
- `QChatPayloadNormalizer`: transforma payload QChat em
  `NormalizedIncomingMessage`.
- `db`: conexao Postgres.

### Presentation

A camada `presentation` lida com HTTP.

Responsabilidades atuais:

- Registrar rotas Fastify.
- Logar recebimento e normalizacao.
- Resolver bot na rota dinamica.
- Montar o use case com gateways dinamicos.
- Retornar respostas HTTP e delegar tratamento de erro para
  `handleWebhookError`.

## BotConfig

`BotConfig` e a configuracao completa do bot em formato de dominio.

Campos relevantes:

- `id`: identificador interno do bot.
- `name`: nome do bot.
- `webhookToken`: token usado na rota dinamica.
- `companyId`: empresa QChat associada.
- `whatsappId`: WhatsApp QChat associado.
- `active`: define se o bot pode ser resolvido.
- `qchat.apiUrl`: URL da API QChat.
- `qchat.apiToken`: token QChat.
- `evolution.apiUrl`: URL da Evolution API.
- `evolution.apiKey`: API key Evolution.
- `evolution.instance`: instance Evolution usada no envio.
- `queues.triageQueueId`: fila de triagem do bot.
- `queues.supportQueueId`: fila de suporte.
- `queues.financeQueueId`: fila financeira.
- `queues.otherQueueId`: fila de outros assuntos.
- `businessHours`: configuracao de horario, ainda parcialmente usada.
- `messages`: mensagens configuraveis.
- `menus`: menus configuraveis.

No banco, esses dados estao em `bot_configs`. As configuracoes compostas ficam em
colunas JSONB:

- `queues_config`
- `business_hours_config`
- `messages_config`
- `menus_config`

## BotContext

`BotContext` e uma versao reduzida e operacional do `BotConfig` para o fluxo de
atendimento.

Campos atuais:

- `botId`
- `botName`
- `triageQueueId`
- `menus`
- `messages`

O use case recebe esse contexto como parametro opcional. A presenca dele ativa o
comportamento dinamico. A ausencia dele mantem o comportamento legado.

## BotConfigResolver

`BotConfigResolver` e o contrato de resolucao de bot.

Metodos atuais:

- `resolveByWebhookToken(webhookToken)`
- `resolveByMessage({ companyId, whatsappId })`

`DefaultBotConfigResolver` delega a busca para `BotConfigRepository`.

Na rota dinamica, o caminho usado hoje e `resolveByWebhookToken`. A resolucao por
mensagem existe para cenarios em que a origem QChat seja usada para identificar o
bot, mas a rota dinamica atual resolve primeiro pelo token da URL.

## BotContextMapper

`BotContextMapper.fromConfig(config)` transforma `BotConfig` em `BotContext`.

Mapeamento atual:

- `config.id` -> `context.botId`
- `config.name` -> `context.botName`
- `config.queues.triageQueueId` -> `context.triageQueueId`
- `config.menus` -> `context.menus`
- `config.messages` -> `context.messages`

Ele nao cria gateways e nao acessa banco. Sua responsabilidade e apenas adaptar
o formato de configuracao para o formato usado no use case.

## MenuResolver

`MenuResolver` le menus e mensagens do `BotContext`.

Operacoes atuais:

- `getMenu(context, menuId)`: busca um menu por id.
- `findButton(context, buttonId)`: procura um botao em todos os menus.
- `getMessage(context, key)`: busca uma mensagem por chave.

Ele e usado no fluxo dinamico para resolver a proxima acao de um botao e para
buscar mensagens de confirmacao.

## MenuToButtonMessage

`MenuToButtonMessage.convert(menu)` converte um `BotMenu` configuravel para o
`ButtonMessage` esperado pelo `MessagingGateway`.

Conversao atual:

- `menu.title` -> `ButtonMessage.title`
- `menu.description` -> `ButtonMessage.description`
- cada botao vira `{ type: "reply", displayText, id }`

Essa conversao desacopla a estrutura de menu persistida da estrutura enviada
pela Evolution API.

## Gateways Dinamicos

Os gateways aceitam configuracao opcional. Isso permite dois modos:

- Com config: fluxo dinamico por bot.
- Sem config: fallback legado por ENV.

### EvolutionMessagingGateway

Config opcional:

```ts
{
  apiUrl: string;
  apiKey: string;
  instance: string;
}
```

No fluxo dinamico, a rota passa `botConfig.evolution`.

Sem config, usa:

- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`

### QChatTicketTransferGateway

Config opcional:

```ts
{
  apiUrl: string;
  apiToken: string;
}
```

No fluxo dinamico, a rota passa `botConfig.qchat`.

Sem config, usa:

- `QCHAT_API_URL`
- `QCHAT_API_TOKEN`

## Fallbacks Legados

Os fallbacks legados existem para preservar `/webhook/qchat`.

Fallbacks atuais quando nao ha `BotContext`:

- Gateways usam ENV.
- Fila de triagem usa `queueConfig.triageQueueId`.
- Transferencias usam `queueConfig.supportQueueId`,
  `queueConfig.financeQueueId` e `queueConfig.otherQueueId`.
- Menus usam `mainMenu`, `financeMenu` e `afterHoursMenu` estaticos.
- Mensagens usam constantes de `application/messages`.

Fallbacks ainda presentes no fluxo dinamico:

- O use case ainda recebe `queueConfig` no construtor, mas quando `BotContext`
  existe a validacao da fila de triagem usa `context.triageQueueId`.
- O horario comercial ainda usa `defaultBusinessHoursConfig` em vez de
  `botConfig.businessHours`.

## Como Dois Bots Coexistem

Dois bots coexistem porque cada um tem um `webhookToken` e uma configuracao
propria em `bot_configs`.

Exemplo:

```text
/webhook/qchat/qos-prod
/webhook/qchat/qos-test-bot
```

`qos-prod` pode apontar para:

- `companyId`: `1`
- `whatsappId`: `127`
- `evolution.instance`: `4120182200`
- filas: `46`, `1`, `3`, `2`
- menus QoS

`qos-test-bot` pode apontar para:

- `companyId`: `2`
- `whatsappId`: `228`
- `evolution.instance`: `qos-test-bot-instance-228`
- filas: `146`, `101`, `103`, `102`
- menus com prefixo `[TEST BOT]`

Na pratica, a mesma aplicacao processa as duas URLs. A diferenca esta no
`BotConfig` resolvido, que altera gateways, menus, mensagens e filas do fluxo
dinamico.

## Onde Novas Integracoes Devem Entrar

Novas integracoes devem entrar por contratos nas camadas corretas:

- Novo provedor de entrada: criar um normalizer em `infrastructure/providers` que
  produza `NormalizedIncomingMessage`.
- Novo canal de envio: implementar `MessagingGateway`.
- Nova plataforma de transferencia: implementar `TicketTransferGateway`.
- Nova persistencia de bot: implementar `BotConfigRepository`.
- Nova regra de resolucao: implementar ou estender `BotConfigResolver`.
- Novo formato de menu: adaptar via mapper/conversor antes de chegar no use
  case.

O use case deve continuar recebendo contratos e dados normalizados. Ele nao deve
depender diretamente de APIs externas.

## Limitacoes Atuais

Limitacoes conhecidas da v1.1:

- `businessHours` existe no `BotConfig`, mas o use case ainda usa
  `defaultBusinessHoursConfig`.
- O fluxo legado ainda depende de ENV e menus estaticos.
- O use case ainda recebe `queueConfig` no construtor para manter fallback
  legado.
- A rota dinamica monta o use case diretamente em `server.ts`; ainda nao ha uma
  factory dedicada para use cases dinamicos.
- A validacao estrutural de `menus_config` e `messages_config` ainda e leve; os
  casts acontecem no mapper.
- As sessoes continuam indexadas principalmente por `ticketId`; nao ha
  isolamento explicito por `botId` na chave de busca atual.
- `resolveByMessage` existe, mas a rota dinamica atual resolve o bot pelo
  `webhookToken`.

## Proximos Passos

Evolucoes recomendadas:

- Usar `botConfig.businessHours` no fluxo dinamico.
- Criar uma factory de use case dinamico para reduzir montagem em `server.ts`.
- Validar `menus_config`, `messages_config` e `queues_config` com schema antes de
  expor o bot.
- Incluir `botId` ou `companyId` na estrategia de sessao para fortalecer
  isolamento multibot.
- Adicionar testes automatizados para rota dinamica com dois bots.
- Adicionar endpoint administrativo ou CLI para criar `BotConfig` sem escrever
  migration manual.
- Expandir resolucao por `companyId`/`whatsappId` quando houver rotas ou canais
  que nao usem `webhookToken`.
- Documentar o processo operacional de rollback de um bot especifico.
