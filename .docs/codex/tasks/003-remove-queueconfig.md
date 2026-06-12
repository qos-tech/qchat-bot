# 003 - Remove QueueConfig from Dynamic Flow

Status: DONE

## Objetivo

Remover dependência de QueueConfig no fluxo dinâmico.

## Requisitos

- Quando BotContext existir, não depender de `this.queues` para decisões.
- Quando BotContext não existir, manter fallback legado.
- Rodar `npm run build`.
- Rodar `npm run test:use-case`.

## Critérios de aceite

- Build OK.
- Teste do UseCase OK.
- Fluxo legado continua funcionando.
- Fluxo dinâmico usa BotContext.
