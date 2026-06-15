# QChat Bot

Bot de triagem para atendimento via WhatsApp integrado ao QChat e Evolution API.

## Visao geral

Esta aplicacao opera em v1.2 com entrada agnostica por provider e suporte a
multibot. O fluxo atual resolve o bot por configuracao persistida, monta
gateways dinamicos e executa regras de atendimento sem depender de um bot
fixo em codigo.

Fluxo principal:

```text
Evolution / QChat
      │
      ▼
Payload Normalizer
      │
      ▼
HandleIncomingMessageUseCase
      │
 ┌────┴────┐
 ▼         ▼
Postgres   Evolution API
             │
             ▼
          WhatsApp

      │
      ▼
QChat API
(Filas e Transferencias)
```

## Funcionalidades

- Entrada agnostica por provider
- Webhook Evolution em `/webhook/evolution`
- Webhook legado QChat em `/webhook/qchat`
- Webhook dinamico QChat em `/webhook/qchat/:webhookToken`
- Resolucao dinamica de `BotConfig` por `webhook_token` e `evolution_instance`
- Menus configuraveis por bot
- Mensagens configuraveis por bot, incluindo identificacao do cliente
- Transferencia para filas do QChat
- Lookup de status de ticket no banco QChat
- Retomada de fluxo quando o atendimento fecha ou reabre
- Resolucao de menu fora do horario com `main`, `after_hours` e `finance`
- Override operacional de horario comercial
- Persistencia de sessoes em PostgreSQL
- Limpeza automatica de sessoes expiradas
- Observabilidade com Correlation ID
- Tratamento centralizado de erros

## Rotas

### Evolution

```text
POST /webhook/evolution
```

O webhook Evolution recebe eventos `messages.upsert`, resolve o bot pela
`instance` enviada no payload, normaliza a mensagem com
`EvolutionPayloadNormalizer` e executa o use case com `BotContext`.

### QChat dinamico

```text
POST /webhook/qchat/:webhookToken
```

A rota dinamica resolve o `BotConfig` pelo token, cria gateways com as
credenciais do bot e usa o mesmo fluxo de atendimento com contexto dinamico.

### QChat legado

```text
POST /webhook/qchat
```

Mantem o fluxo antigo baseado em variaveis de ambiente. Esta rota nao deve ser
alterada para migracoes futuras sem planejamento.

## Variaveis de ambiente

```env
PORT=3000

DATABASE_URL=

QCHAT_API_URL=
QCHAT_API_TOKEN=
QCHAT_DB_URL=

EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=

QCHAT_QUEUE_TRIAGE_ID=
QCHAT_QUEUE_SUPPORT_ID=
QCHAT_QUEUE_FINANCE_ID=
QCHAT_QUEUE_OTHER_ID=

BUSINESS_HOURS_OVERRIDE=

SESSION_RETENTION_DAYS=7

EXTERNAL_API_RETRY_ATTEMPTS=3
EXTERNAL_API_RETRY_BASE_DELAY_MS=500
```

`QCHAT_DB_URL` e usado pelo lookup de tickets do QChat. `BUSINESS_HOURS_OVERRIDE`
permite forcar `business_hours` ou `after_closing` durante validacao e suporte
operacional.

## Execucao local e Docker

### Desenvolvimento local

```bash
npm install
npm run migrate:up
npm run dev
```

`npm run dev` usa `tsx src/presentation/http/server.ts` e e o caminho mais
rapido para desenvolvimento.

### Build e execucao compilada

```bash
npm run build
npm run start
```

`npm run start` executa `node dist/presentation/http/server.js`.

### Docker

```bash
docker compose up -d
docker compose exec qchat-bot npm run migrate:up
```

A imagem de producao roda o binario compilado via `npm start`, portanto o
comportamento deve ser validado tambem apos `npm run build`.

## Operacao

### Bots

```bash
npm run bot:list
npm run bot:show -- <botId>
npm run bot:show -- <companyId>:<whatsappId>
npm run bot:rotate-token -- <botId>
npm run bot:rotate-token -- <companyId>:<whatsappId>
npm run bot:health -- <botId>
npm run bot:health -- <companyId>:<whatsappId>
```

### Sessoes

```bash
npm run cleanup:sessions
```

### Health check

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

## Fluxos implementados

### Horario comercial

1. Suporte
2. Financeiro
3. Outros

### Fora do horario

1. Suporte
2. Outros

### Evolution

1. Texto simples abre menu
2. Botao envia transferencia ou submenu
3. `waiting_human` respeita estado do ticket no QChat
4. Atendimento fechado pode ser retomado pelo bot

## Configuracao de mensagens

As mensagens do bot ficam em `messages_config`. Para identificacao do cliente,
as chaves usadas sao:

```json
{
  "customer_identification_prompt": "Para adiantar seu atendimento, informe a sua empresa ou o CNPJ.",
  "customer_identification_invalid": "Nao consegui identificar a informacao enviada.",
  "customer_identification_transfer_template": "Identificacao do cliente: {{value}}"
}
```

Se a chave nao existir, o bot usa um fallback interno e continua funcionando.

## Estrutura do projeto

```text
src/
├── application/
├── config/
├── domain/
├── infrastructure/
├── presentation/
├── scripts/
└── shared/
```

## Roadmap

### v1.1

- Multibot por `BotConfig`
- Gateway dinamico por bot
- Rotas legado e dinamica coexistindo

### v1.2

- Entrada agnostica por provider
- Webhook Evolution
- Lookup de status do ticket QChat
- Regras de retomada e horario comercial

### v1.3

- Integracao GLPI
- Abertura automatica de chamados
- Consulta e atualizacao de chamados
