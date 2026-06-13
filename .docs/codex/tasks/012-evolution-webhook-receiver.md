# 012 - Evolution Webhook Receiver

Status: DONE

## Objetivo

Criar a entrada HTTP para receber webhooks da Evolution API.

## Contexto

A task 011 preparou o domínio para mensagens agnósticas de provider.

Agora precisamos criar a rota:

POST /webhook/evolution

Ela deve processar eventos `messages.upsert`.

## Fluxo esperado

1. Receber payload Evolution
2. Validar `event === "messages.upsert"`
3. Obter `instance`
4. Resolver BotConfig por Evolution instance
5. Criar BotContext
6. Normalizar payload com EvolutionPayloadNormalizer
7. Executar HandleIncomingMessageUseCase com BotContext

## Requisitos

- Criar rota `POST /webhook/evolution`
- Não remover nem alterar `/webhook/qchat`
- Não remover nem alterar `/webhook/qchat/:webhookToken`
- Ignorar eventos que não sejam `messages.upsert` retornando 200
- Se bot não for encontrado pela instance, retornar 404
- Usar `EvolutionPayloadNormalizer`
- Usar `resolveByEvolutionInstance`
- Usar `BotContextMapper`
- Executar `handleIncomingMessageUseCase.execute(normalizedMessage, context)`
- Tratar erros com `handleWebhookError`
- Logs devem incluir:
  - event
  - instance
  - provider
  - messageId
  - conversationId
  - phone
  - kind
  - fromMe

## Critérios de aceite

- `npm run build` passa
- `POST /webhook/evolution` aceita fixture Evolution
- Payload `messages.upsert` dispara o fluxo do bot
- Evento diferente de `messages.upsert` retorna 200 sem processar
- QChat webhooks continuam funcionando
