# 023 - Evolution Human Ticket Guard

Status: DONE

## Objetivo

Impedir que o bot envie menu ou responda automaticamente quando já existir atendimento humano ativo no QChat, mesmo que a sessão local do bot não esteja em `waiting_human`.

## Contexto

Foi identificado em produção que um cliente estava com ticket aberto no QChat:

```text
status = open
queueId = 1
userId = 2
```
