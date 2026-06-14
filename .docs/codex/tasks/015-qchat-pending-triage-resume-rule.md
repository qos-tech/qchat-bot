# 015 - QChat Pending Triage Resume Rule

Status: DONE

## Objetivo

Ajustar a regra de retomada do bot quando uma sessão está em `waiting_human` e o ticket do QChat volta para `pending`.

## Contexto

No fluxo Evolution:

1. Cliente entra pelo webhook da Evolution.
2. Bot envia menu.
3. Cliente escolhe uma opção.
4. Bot transfere para o QChat.
5. Sessão fica como `waiting_human`.
6. Atendente fecha o atendimento no QChat.
7. Quando o cliente envia nova mensagem, o QChat pode alterar o ticket de `closed` para `pending` antes do bot consultar o banco.
8. Hoje o bot interpreta `pending` como atendimento humano ainda aberto e ignora a mensagem.

Isso impede que o bot reinicie o atendimento.

## Regra nova

Quando existir sessão em `waiting_human` e o lookup do QChat retornar um ticket:

### Status `open`

Considerar atendimento humano ativo.

Resultado:

- não responder
- manter sessão

Log reason:

```text
human_ticket_still_open
```

### Status `closed`

Considerar atendimento encerrado.

Resultado:

- apagar sessão
- reiniciar fluxo do bot

Log reason:

```text
human_ticket_closed
```

### Status `pending` com `userId` preenchido

Considerar atendimento humano ativo ou atribuído.

Resultado:

- não responder
- manter sessão

Log reason:

```text
human_ticket_still_open
```

### Status `pending` com `userId` vazio/null e `queueId` igual ao `context.triageQueueId`

Considerar que o atendimento voltou para a triagem do bot após novo contato.

Resultado:

- apagar sessão
- reiniciar fluxo do bot

Log reason:

```text
human_ticket_pending_in_triage
```

### Status `pending` com `userId` vazio/null e `queueId` diferente de `context.triageQueueId`

Considerar situação ambígua, possivelmente outra fila humana.

Resultado:

- não responder
- manter sessão

Log reason:

```text
human_ticket_pending_outside_triage
```

### Ticket não encontrado

Comportamento seguro.

Resultado:

- não responder
- manter sessão

Log reason:

```text
human_ticket_not_found
```

## Requisitos técnicos

- Não hardcodar `queueId`.
- Usar `context.triageQueueId`.
- Garantir que o retorno do lookup tenha:
  - `status`
  - `userId`
  - `queueId`
  - `ticketId`

- Se necessário, ajustar o tipo do lookup.
- Manter compatibilidade com QChat legado.
- Não alterar schema do banco.
- Não alterar migrations.
- Não alterar o status `close`; ele não deve ser considerado fechado nesta task.

## Testes obrigatórios

Atualizar `npm run test:qchat-ticket-status-lookup` para cobrir:

1. `status = open`
   - espera ignorar
   - manter sessão

2. `status = pending`, `userId` preenchido
   - espera ignorar
   - manter sessão

3. `status = pending`, `userId = null`, `queueId = context.triageQueueId`
   - espera apagar sessão
   - reiniciar fluxo
   - enviar menu

4. `status = pending`, `userId = null`, `queueId != context.triageQueueId`
   - espera ignorar
   - manter sessão

5. `status = closed`
   - espera apagar sessão
   - reiniciar fluxo
   - enviar menu

6. ticket não encontrado
   - espera ignorar
   - manter sessão

## Critérios de aceite

- `npm run build` passa.
- `npm run test:qchat-ticket-status-lookup` passa.
- Fluxo Evolution continua funcionando.
- Fluxo QChat não é alterado.
- Logs deixam claro o motivo da decisão.
