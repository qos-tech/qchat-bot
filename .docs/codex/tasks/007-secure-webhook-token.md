# 007 - Secure Webhook Token

Status: DONE

## Objetivo

Substituir tokens previsíveis por tokens seguros para uso em produção.

## Motivação

Atualmente exemplos como:

- qos-prod
- qos-test-bot

são úteis para desenvolvimento, mas são previsíveis.

O webhook_token deve ser tratado como credencial.

## Requisitos

### Banco

- webhook_token continua sendo varchar.
- Garantir UNIQUE.

### Geração

- Criar utilitário para gerar tokens.
- Utilizar crypto.randomUUID() inicialmente.

Exemplo:

3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c

### Seeds

- Seeds de produção devem utilizar tokens seguros.
- Seeds de homologação podem continuar legíveis para facilitar testes.

### Logging

- Evitar expor o token completo em logs de produção.
- Opcionalmente mascarar:

3f9e0a7d-\***\*-\*\***-\*\*\*\*-9b7d18df5a2c

### Documentação

Atualizar:

- new-bot-onboarding.md
- multibot-final-design.md

explicando que webhook_token é segredo operacional.

## Critérios de aceite

- Novo bot pode ser criado com token seguro.
- Build passa.
- Resolver continua funcionando.
- Seeds de teste continuam funcionando.
