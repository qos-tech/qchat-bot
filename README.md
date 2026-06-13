# QChat Bot

Bot de triagem para atendimento via WhatsApp integrado ao QChat e Evolution API.

## Funcionalidades

- Menu principal de atendimento
- Menu financeiro
- Atendimento fora do horário comercial
- Transferência automática para filas do QChat
- Persistência de sessões em PostgreSQL
- Limpeza automática de sessões expiradas
- Retry automático para integrações externas
- Observabilidade com Correlation ID
- Tratamento centralizado de erros

---

## Arquitetura

```text
QChat Webhook
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
(Filas e Transferências)
```

---

## Tecnologias

- Node.js 22
- TypeScript
- Fastify
- PostgreSQL
- node-pg-migrate
- Docker
- Evolution API
- QChat

---

## Variáveis de Ambiente

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

SESSION_RETENTION_DAYS=7

EXTERNAL_API_RETRY_ATTEMPTS=3
EXTERNAL_API_RETRY_BASE_DELAY_MS=500
```

---

## Desenvolvimento

Instalação:

```bash
npm install
```

Executar migrations:

```bash
npm run migrate:up
```

Executar em modo desenvolvimento:

```bash
npm run dev
```

---

## Build

Gerar artefatos:

```bash
npm run build
```

Executar versão compilada:

```bash
npm run start
```

---

## Docker

Subir ambiente:

```bash
docker compose up -d
```

Executar migrations:

```bash
docker compose exec qchat-bot npm run migrate:up
```

Ver logs:

```bash
docker compose logs -f qchat-bot
```

---

## Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

---

## Fluxos Implementados

### Horário Comercial

1. Suporte
2. Financeiro
3. Outros

### Fora do Horário

1. Suporte
2. Outros

---

## Observabilidade

Todos os atendimentos recebem um Correlation ID único.

Exemplo:

```text
qchat:15551:3EB05FFF052291E3EB4C88
```

Esse identificador é propagado entre:

- Webhook
- Use Cases
- Evolution API
- QChat API
- Logs
- Tratamento de erros

---

## Limpeza de Sessões

Execução manual:

```bash
docker compose exec -T qchat-bot npm run cleanup:sessions
```

Exemplo:

```text
[CLEANUP] 15 sessões removidas (retenção: 7 dias)
```

Cron recomendado:

```cron
0 2 * * * cd /opt/docker/qchat-bot && docker compose exec -T qchat-bot npm run cleanup:sessions >> /var/log/qchat-bot-cleanup.log 2>&1
```

---

## Estrutura do Projeto

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

---

## Roadmap

### v1.1.0

- Integração GLPI
- Abertura automática de chamados
- Consulta de chamados
- Atualização de chamados

### v1.2.0

- Base de conhecimento
- RAG
- Respostas assistidas por IA

### v1.3.0

- Multiempresa
- Menus por empresa
- Horários por empresa
- Filas por empresa

---

## Status

### Versão Atual

**v1.0.0**

### Estado

✅ Produção

### MVP

Concluído e validado em ambiente real.
