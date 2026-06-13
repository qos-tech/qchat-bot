# 001 - Dynamic Evolution Gateway

Status: DONE

## Objetivo

Usar a configuração Evolution do BotConfig na rota dinâmica.

## Requisitos

- Não alterar a rota antiga `/webhook/qchat`.
- Não alterar QChat gateway ainda.
- Usar `botConfig.evolution` na rota `/webhook/qchat/:webhookToken`.
- O menu da rota dinâmica deve ser enviado pela instance configurada no banco.
- Rodar `npm run build`.

## Critérios de aceite

- Build OK.
- Rota antiga continua funcionando.
- Rota dinâmica usa Evolution do BotConfig.
