# 006 - Multibot Final Design

Status: DONE

## Objetivo

Documentar a arquitetura final da v1.1 multibot.

## Entregáveis

Criar:

.docs/architecture/multibot-final-design.md

## Conteúdo mínimo

- Visão geral da arquitetura multibot
- Fluxo da rota dinâmica
- Fluxo da rota legada
- Responsabilidades de cada camada
- BotConfig
- BotContext
- BotConfigResolver
- BotContextMapper
- MenuResolver
- MenuToButtonMessage
- Gateways dinâmicos
- Fallbacks legados
- Como dois bots coexistem
- Limitações atuais
- Próximos passos

## Critérios de aceite

- Documento explica o desenho atual sem depender do histórico da conversa.
- Documento diferencia claramente fluxo legado e fluxo dinâmico.
- Documento deixa claro onde novas integrações devem entrar.
