# 011 - Provider Agnostic Incoming Messages

Status: DONE

## Objetivo

Preparar o domínio de entrada para aceitar mensagens de múltiplos providers, começando pela Evolution.

Hoje o fluxo foi criado inicialmente para o QChat, mas a entrada do bot deve ser agnóstica.

O QChat continuará sendo usado como integração de transferência via API, enquanto a Evolution poderá ser usada como origem de mensagens.

## Motivação

A Evolution envia payloads `messages.upsert` que não possuem ticketId, queueId ou status do QChat.

Mesmo assim, o bot consegue operar porque:

- possui telefone
- possui messageId
- possui instance
- possui texto/botão
- consegue resolver o bot pela Evolution instance
- consegue transferir no QChat usando número, fila e mensagem

## Requisitos

### 1. NormalizedIncomingMessage

Atualizar o tipo para suportar entrada agnóstica.

Adicionar:

- `conversationId: string`

Manter compatibilidade com os campos existentes:

- `ticketId`
- `companyId`
- `whatsappId`
- `queueId`
- `userId`
- `status`

Esses campos devem continuar opcionais.

### 2. Compatibilidade temporária

Enquanto o repositório de sessões ainda usa `ticketId`, usar:

- QChat: `conversationId = String(ticketId)`
- Evolution: `conversationId = `${instance}:${phone}``

O `ticketId` pode continuar sendo preenchido com o mesmo valor de `conversationId` no caso da Evolution, apenas como compatibilidade temporária.

Não renomear ainda tabelas ou métodos como `findByTicketId`.

### 3. QChat normalizer

Atualizar o normalizer do QChat para preencher:

- `conversationId`
- mantendo `ticketId`

### 4. Evolution Payload Normalizer

Criar:

```text
src/infrastructure/providers/evolution/evolution-payload-normalizer.ts
```
