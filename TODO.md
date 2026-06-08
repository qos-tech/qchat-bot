# TODO - QChat Bot

## Core

- [x] Normalizador QChat
- [x] Repositório PostgreSQL
- [x] Business Hours Service
- [x] Bootstrap da aplicação

## Fluxos

- [x] Menu principal
- [x] Menu financeiro
- [x] Menu fora do horário

## Integrações

- [x] Evolution Messaging Gateway
- [x] QChat Ticket Transfer Gateway
- [x] Retry em APIs externas

## HTTP / Webhook

- [x] Servidor Fastify
- [x] Health Check
- [x] Webhook QChat
- [x] Payload real do QChat
- [x] Payload encapsulado
- [x] Tratamento de erros

## Observabilidade

- [x] Logs estruturados
- [x] Correlation ID no UseCase
- [x] Correlation ID nos gateways
- [x] Correlation ID nos erros externos
- [x] Rastreabilidade ponta a ponta

## Resiliência

- [x] ExternalApiError
- [x] Diferenciar erro interno 500 e erro externo 502
- [x] Retry em falhas de rede
- [x] Retry em HTTP 408/429/5xx
- [x] Não repetir erro 4xx definitivo
- [x] Retentativas configuráveis por ENV

## Manutenção

- [x] Cleanup de sessões
- [x] Índice em `bot_sessions.updated_at`
- [x] Retenção configurável por ENV

## Deploy

- [x] Dockerfile
- [x] .dockerignore
- [x] docker-compose
- [x] PostgreSQL externo
- [x] Migrations no container
- [x] Teste em servidor

---

# Produção

- [ ] Agendar `cleanup:sessions` via cron
- [ ] Configurar domínio público
- [ ] Configurar SSL
- [ ] Apontar webhook definitivo do QChat
- [ ] Revisar backup do banco
- [ ] Revisar constraints do banco

---

# Próximo Marco

## Integração GLPI

- [ ] Validar usuário por telefone
- [ ] Buscar usuário no GLPI
- [ ] Abrir chamado
- [ ] Retornar número do chamado
- [ ] Consultar chamado
- [ ] Adicionar acompanhamento
- [ ] Encerrar chamado

---

# Futuro

## IA

- [ ] Base de conhecimento
- [ ] RAG
- [ ] Classificação automática

## Multiempresa

- [ ] Filas por empresa
- [ ] Menus por empresa
- [ ] Horários por empresa
- [ ] Mensagens por empresa
