# 004 - Second Bot Configuration Validation

Status: TODO

## Objetivo

Criar uma segunda configuração de bot para validar multibot real.

## Requisitos

- Criar seed/migration para um segundo bot de teste.
- Usar webhook_token diferente.
- Usar whatsapp_id diferente.
- Usar evolution_instance diferente.
- Usar título de menu diferente.
- Usar filas de teste diferentes.
- Não alterar rota antiga.
- Não quebrar o bot qos-prod.
- Rodar npm run build.
- Rodar teste manual de BotConfig/Resolver, se aplicável.

## Critérios de aceite

- `/webhook/qchat/qos-prod` carrega o bot QoS.
- `/webhook/qchat/<novo-token>` carrega o segundo bot.
- Os menus exibidos são diferentes.
- As filas de transferência são diferentes.
