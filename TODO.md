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
- [x] Índice em bot_sessions.updated_at
- [x] Retenção configurável por ENV
- [x] Agendamento via cron

## Deploy

- [x] Dockerfile
- [x] .dockerignore
- [x] docker-compose
- [x] PostgreSQL externo
- [x] Migrations no container
- [x] Teste em servidor
- [x] Domínio público
- [x] SSL
- [x] Webhook definitivo configurado

---

# Produção

- [ ] Revisar estratégia de backup PostgreSQL
- [ ] Avaliar índices após crescimento real

---

# Próximo Marco

## Integração GLPI

### Fase 1

- [ ] Validar usuário por telefone
- [ ] Buscar usuário no GLPI
- [ ] Abrir chamado
- [ ] Retornar número do chamado

### Fase 2

- [ ] Consultar chamado
- [ ] Adicionar acompanhamento
- [ ] Encerrar chamado

### Fase 3

- [ ] Integração completa Bot ↔ GLPI

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

---

# Status Atual

## MVP

✅ Concluído

### Funcionalidades operacionais

- Recebimento de mensagens do QChat
- Criação e controle de sessões
- Menus interativos via Evolution
- Transferência automática para filas
- Fluxo financeiro
- Fluxo fora do horário
- Recuperação de tickets reutilizados
- Tratamento de erros
- Retry automático
- Observabilidade completa
- Deploy em produção
- Limpeza automática de sessões

### Próxima entrega de valor

➡️ Integração com GLPI para abertura automática de chamados
