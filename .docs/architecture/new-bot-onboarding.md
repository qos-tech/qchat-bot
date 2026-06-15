# Onboarding de Novo Bot

Este guia descreve o processo para criar, validar e colocar em operacao um novo
bot na arquitetura multibot da v1.2.

## Objetivo

Um bot novo precisa entrar com configuracao propria no banco, webhook proprio,
instance Evolution propria e contexto QChat proprio. O fluxo de atendimento
deve funcionar sem dependencia do historico de outro bot.

## Checklist rapido

1. Criar instance Evolution exclusiva.
2. Confirmar `companyId` e `whatsappId` no QChat.
3. Preencher `bot_configs`.
4. Validar `menus_config` e `messages_config`.
5. Aplicar migration/seed.
6. Rodar `npm run bot:health`.
7. Configurar webhook Evolution em `/webhook/evolution`.
8. Configurar webhook QChat dinamico em `/webhook/qchat/:webhookToken`.
9. Testar texto, botao, atendimento aberto e retomada pos-fechamento.
10. Validar horario com `BUSINESS_HOURS_OVERRIDE`.

## 1. Configurar Evolution

Crie uma instance exclusiva para o bot.

Exemplo:

```text
instance: acme-whatsapp-001
apiUrl: https://api.evolution.exemplo.com
apiKey: <EVOLUTION_API_KEY_DO_BOT>
```

Validacoes minimas:

- instance conectada
- envio de texto funcionando
- envio de botoes funcionando
- instance nao compartilhada com outro bot

## 2. Configurar QChat

Confirme os dados de integracao do bot:

```text
companyId: 10
whatsappId: 501
apiUrl: https://api.qchat.exemplo.com
apiToken: <QCHAT_API_TOKEN_DO_BOT>
```

Esses valores identificam o bot no lookup do QChat e precisam bater com os
eventos de entrada usados em homologacao ou producao.

## 3. Preencher bot_configs

Crie uma migration/seed com um registro em `bot_configs`.

Campos principais:

- `name`
- `webhook_token`
- `company_id`
- `whatsapp_id`
- `active`
- `qchat_api_url`
- `qchat_api_token`
- `evolution_api_url`
- `evolution_api_key`
- `evolution_instance`
- `queues_config`
- `business_hours_config`
- `messages_config`
- `menus_config`

Exemplo de homologacao usado para validacao multibot:

```text
webhookToken: qos-test-bot
companyId: 2
whatsappId: 228
evolutionInstance: qos-test-bot-instance-228
triageQueueId: 146
supportQueueId: 101
financeQueueId: 103
otherQueueId: 102
```

Se o bot for de producao, gere um `webhook_token` nao previsivel:

```bash
node -e "console.log(require('node:crypto').randomUUID())"
```

Exemplo de token seguro:

```text
3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c
```

## 4. Definir menus e mensagens

Os menus ficam em `menus_config`. Os botao precisam apontar para acoes validas
e para `messageKey` existentes em `messages_config`.

Mensagens de identificacao do cliente:

```json
{
  "customer_identification_prompt": "Para adiantar seu atendimento, informe a sua empresa ou o CNPJ.",
  "customer_identification_invalid": "Nao consegui identificar a informacao enviada.",
  "customer_identification_transfer_template": "Identificacao do cliente: {{value}}"
}
```

Menus minimos:

- `main`
- `after_hours`

Se houver menu financeiro:

- `finance`

Checklist de menu:

- titulo identifica o bot visualmente
- botoes usam ids unicos
- `transfer` aponta para fila valida
- `send_menu` aponta para outro menu existente
- `messageKey` existe em `messages_config`

## 5. Aplicar migration/seed

Use o padrao:

```text
<timestamp>_seed-<nome-do-bot>.ts
```

Comando:

```bash
npm run migrate:up
```

Depois da aplicacao, confirme que a linha entrou em `bot_configs`.

## 6. Validar o bot

### Health check

```bash
npm run bot:health -- <botId>
npm run bot:health -- <companyId>:<whatsappId>
```

O comando valida resolucao, config e estado operacional do bot.

### Resolver de configuracao

```bash
npm run test:bot-config-resolver
```

### Caminho Evolution

Configure o webhook publico para:

```text
https://<host-publico>/webhook/evolution
```

O payload precisa conter um evento `messages.upsert` e uma `instance` valida.
O bot sera resolvido por `evolution_instance`.

### Caminho QChat dinamico

Configure o webhook publico para:

```text
https://<host-publico>/webhook/qchat/<webhookToken>
```

## 7. Testes manuais obrigatorios

### Texto -> menu

- Envie uma mensagem simples.
- Confirme que o menu correto e enviado.

### Botao -> transferencia

- Clique em um botao de transferencia.
- Confirme a transferencia para a fila correta.

### Atendimento aberto

- Simule ticket `open` ou `pending` com atendimento ativo.
- Confirme que o bot ignora a mensagem e nao reinicia o fluxo.

### Atendimento fechado ou reaberto

- Simule ticket fechado.
- Confirme que o bot retoma o fluxo.

### Horario comercial

Para testar fora do horario ou forcar um estado especifico:

```bash
BUSINESS_HOURS_OVERRIDE=after_closing npm run test:business-hours
BUSINESS_HOURS_OVERRIDE=business_hours npm run test:business-hours
```

## 8. Go live

Checklist final:

- instance Evolution conectada e validada
- QChat API URL e token conferidos
- `companyId` e `whatsappId` conferidos
- filas de triagem, suporte, financeiro e outros conferidas
- menus revisados
- mensagens revisadas
- `webhook_token` seguro gerado e guardado como segredo operacional
- `npm run migrate:up` executado no ambiente alvo
- `npm run bot:health` executado no ambiente alvo
- teste real de entrada feito
- teste real de transferencia feito
- logs revisados para confirmar resolucao, menu e transferencia
