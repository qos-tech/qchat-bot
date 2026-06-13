# 013 - QChat Ticket Status Lookup

Status: DONE

## Objetivo

Permitir que o bot consulte o banco do QChat para saber se um atendimento humano ainda está aberto.

## Contexto

Com a entrada via Evolution, o bot não recebe eventos de fechamento do QChat.

Hoje, quando a sessão está em `waiting_human`, o bot não sabe se:

- o atendimento humano ainda está em andamento
- o ticket já foi fechado no QChat
- o cliente está iniciando um novo atendimento

Como temos acesso ao banco do QChat, a decisão deve ser feita consultando o ticket mais recente do contato.

## Variáveis de Ambiente

Adicionar suporte a:

```env
QCHAT_DB_URL=
```
