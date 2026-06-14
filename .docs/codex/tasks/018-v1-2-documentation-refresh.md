# 018 - v1.2 Documentation Refresh

Status: DONE

## Objetivo

Atualizar README e documentações internas para refletir o estado real da v1.2.

## Contexto

Após as tasks 011 a 017, a plataforma evoluiu de multibot para:

- entrada agnóstica por provider
- webhook Evolution
- transferência via QChat API
- lookup de status no banco QChat
- retomada de fluxo após fechamento/reabertura
- resolução correta de menu fora do horário
- override operacional de horário comercial

A documentação atual ainda reflete principalmente a v1.1.

## Entregáveis

Atualizar, no mínimo:

- README.md
- .docs/architecture/multibot-final-design.md
- .docs/architecture/new-bot-onboarding.md
- .docs/codex/BACKLOG.md
- .docs/codex/ROADMAP.md

## Conteúdo obrigatório

### README.md

Adicionar/atualizar seções sobre:

- visão geral da arquitetura v1.2
- fluxo Evolution como entrada
- QChat como transferência
- `QCHAT_DB_URL`
- `BUSINESS_HOURS_OVERRIDE`
- comandos operacionais:
  - `bot:list`
  - `bot:show`
  - `bot:rotate-token`
  - `bot:health`
- diferença entre uso local com `tsx src/...` e produção Docker com `node dist/...`
- webhook Evolution:
  - URL `/webhook/evolution`
  - evento `messages.upsert`

### multibot-final-design.md

Atualizar arquitetura para incluir:

- provider-agnostic input
- `conversationId`
- `EvolutionPayloadNormalizer`
- resolução por `evolution_instance`
- `POST /webhook/evolution`
- QChat ticket status lookup
- regra de `waiting_human`
- regra `pending + userId vazio + queueId triagem`
- active menu resolution:
  - `main`
  - `after_hours`
  - `finance`
- `BUSINESS_HOURS_OVERRIDE`

### new-bot-onboarding.md

Atualizar checklist de onboarding com:

- configurar Evolution instance
- configurar QChat connection
- preencher `bot_configs`
- validar menus/messages
- rodar `bot:health`
- configurar webhook Evolution
- testar:
  - texto → menu
  - botão → transferência
  - atendimento aberto → bot ignora
  - atendimento fechado/reaberto → bot retoma
- como testar horário usando `BUSINESS_HOURS_OVERRIDE`

### BACKLOG.md

Marcar tasks concluídas:

- 011
- 012
- 013
- 014
- 015
- 016
- 017
- 018

Adicionar próxima épica:

- Epic 3 - GLPI Integration

### ROADMAP.md

Atualizar roadmap:

- v1.1: multibot
- v1.2: provider-agnostic Evolution entry + QChat lifecycle
- v1.3 ou próxima fase: GLPI

## Requisitos

- Não alterar código de runtime.
- Não alterar migrations.
- Não alterar seeds.
- Não alterar package.json, exceto se houver documentação incorreta.
- Manter linguagem objetiva e operacional.

## Validação

- Rodar `npm run build`.
- Não precisa rodar testes funcionais, pois a task é documental.

## Critérios de aceite

- README explica como operar local e em Docker.
- Docs refletem o fluxo Evolution atual.
- Onboarding permite configurar um novo bot sem depender do histórico da conversa.
- Backlog e roadmap ficam coerentes com o estado atual.
- Status desta task atualizado para DONE.
