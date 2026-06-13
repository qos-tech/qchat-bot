# 008 - Webhook Token Management

Status: DONE

## Objetivo

Permitir visualizar e regenerar webhook tokens de forma segura.

## Motivação

Após a task 007, os tokens deixam de ser previsíveis.

Precisamos de uma forma operacional de:

- descobrir o token atual de um bot
- regenerar um token
- validar um token

sem acessar o banco manualmente.

## Requisitos

### Script de listagem

Criar:

npm run bot:list

Saída:

Bot Name | CompanyId | WhatsAppId | Token Masked

Exemplo:

QoS Produção | 1 | 127 | 3f9e0a7d-\***\*-\*\***-\*\*\*\*-9b7d18df5a2c

### Script de detalhes

Criar:

npm run bot:show <botId>

Exibir:

- nome
- companyId
- whatsappId
- webhookToken completo

### Script de rotação

Criar:

npm run bot:rotate-token <botId>

Requisitos:

- gerar novo token usando generateWebhookToken()
- atualizar banco
- exibir token antigo mascarado
- exibir token novo completo

### Segurança

- listagem nunca mostra token completo
- logs nunca mostram token completo

## Critérios de aceite

- build passa
- possível descobrir token atual
- possível rotacionar token sem SQL manual
- possível validar resultado após rotação
