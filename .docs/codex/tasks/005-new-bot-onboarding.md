# 005 - New Bot Onboarding

Status: DONE

## Objetivo

Documentar o processo completo para criação e ativação de um novo bot na plataforma.

## Entregáveis

Criar:

.docs/architecture/new-bot-onboarding.md

## Conteúdo mínimo

### Visão Geral

- O que é um BotConfig
- O que é um BotContext
- Como o webhook resolve o bot

### Pré-requisitos

- Evolution API
- QChat
- Banco de dados
- Webhook público

### Passo 1 - Criar Instância Evolution

- Nome da instância
- Validação da instância
- Teste de envio

### Passo 2 - Criar Integração QChat

- companyId
- whatsappId
- Token
- URL

### Passo 3 - Criar BotConfig

Explicar cada campo:

- webhookToken
- companyId
- whatsappId
- evolution
- qchat
- menus
- messages

### Passo 4 - Criar Menus

Exemplo de menu principal.

### Passo 5 - Criar Mensagens

Exemplo de mensagens de confirmação.

### Passo 6 - Aplicar Migration/Seed

Como executar.

### Passo 7 - Validar Bot

- test:bot-config-resolver
- webhook
- menu
- transferência

### Passo 8 - Go Live

Checklist de produção.

## Critérios de aceite

- Um operador consegue criar um novo bot apenas seguindo a documentação.
- Não requer conhecimento do histórico do projeto.
- Incluir exemplos reais.
