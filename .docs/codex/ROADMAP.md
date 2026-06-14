# Roadmap Codex

## Objetivo

Evoluir o QChat Bot por fases claras, mantendo o fluxo legado enquanto o fluxo
multibot e a entrada agnostica amadurecem.

## Fase v1.1 - Multibot

- BotConfig por bot
- resolucao dinamica de Evolution e QChat
- coexistencia entre fluxo legado e fluxo dinamico
- gestao de webhook token
- onboarding operacional de novos bots

## Fase v1.2 - Provider agnostico e ciclo de atendimento

- entrada Evolution por `POST /webhook/evolution`
- normalizacao de mensagens por provider
- `conversationId` como identificador de correlacao
- lookup de status do ticket no QChat
- regra de retomada para `waiting_human`
- resolucao de menu ativa por horario
- override operacional de horario comercial
- validacao de BotConfig e health check

## Fase v1.3 - GLPI

- integracao GLPI
- abertura automatica de chamados
- consulta de chamados
- atualizacao de chamados

