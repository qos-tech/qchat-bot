# 002 - Dynamic QChat Gateway

Status: TODO

## Objetivo

Usar a configuração QChat do BotConfig na rota dinâmica.

## Requisitos

- Não alterar a rota antiga `/webhook/qchat`.
- Usar `botConfig.qchat` na rota `/webhook/qchat/:webhookToken`.
- Transferências da rota dinâmica devem usar URL/token do bot.
- Rodar `npm run build`.

## Critérios de aceite

- Build OK.
- Rota antiga continua funcionando.
- Rota dinâmica transfere usando QChat do BotConfig.
