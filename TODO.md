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

## Horário Comercial

- [x] Suporte
- [x] Financeiro
- [x] Outros

## Fora do Horário

- [x] Suporte
- [x] Outros

## Integrações

- [x] Evolution Messaging Gateway
- [x] QChat Ticket Transfer Gateway

## HTTP

- [x] Servidor Fastify
- [x] Health Check
- [x] Webhook QChat

## Webhook

- [x] Integração Webhook → Normalizer
- [x] Integração Normalizer → UseCase
- [x] Tratamento de erros
- [x] Compatibilidade com payload real do QChat
- [x] Compatibilidade com payload encapsulado

## Configuração

- [x] env.ts
- [x] Validação Zod
- [x] Remoção de process.env direto
- [x] Startup validation

## Proteções

- [x] Ignorar mensagens do próprio sistema
- [x] Ignorar tickets atribuídos
- [x] Ignorar filas fora da triagem
- [x] Evitar transferências duplicadas
- [x] Evitar alteração de estado após falha
- [x] Recuperação de tickets reutilizados
- [x] Reset de sessões waiting_human ao retornar para triagem

## Tratamento de Erros

- [x] ExternalApiError
- [x] Erros Evolution
- [x] Erros QChat
- [x] Diferenciar 500 e 502
- [x] Logs contextualizados
- [x] Respostas HTTP padronizadas
- [ ] Estratégia de retry

## Observabilidade

### Logs

- [x] message_received
- [x] session_checked
- [x] session_saved
- [x] session_deleted
- [x] menu_sent
- [x] ticket_transferred
- [x] message_ignored
- [x] business_hours_checked
- [x] message_unhandled
- [x] external_api_error

### Correlation ID

- [x] Criar correlation ID por atendimento
- [x] Incluir correlation ID nos logs do UseCase
- [x] Incluir correlation ID nos gateways
- [x] Propagar correlation ID para ExternalApiError
- [x] Rastreabilidade ponta a ponta

## Banco

- [x] Índice em updated_at
- [x] SessionMaintenanceRepository
- [x] CleanupSessionsUseCase
- [x] cleanup:sessions
- [x] Retenção configurável por ENV

## Deploy

- [x] Dockerfile
- [x] .dockerignore
- [x] docker-compose
- [x] Healthcheck
- [x] Build local
- [x] Deploy em servidor
- [x] PostgreSQL externo
- [x] Migrations dentro do container

## Testes

- [x] Repository
- [x] Business Hours
- [x] Use Case
- [x] Evolution real
- [x] QChat real
- [x] Bootstrap
- [x] Webhook real
- [x] Simulação de falhas
- [x] Reabertura de atendimento

---

# Produção

## Pendente

- [ ] Agendar cleanup:sessions via cron
- [ ] Definir retenção final
- [ ] Revisar constraints do banco
- [ ] Revisar backup
- [ ] Configurar domínio público
- [ ] Configurar SSL
- [ ] Apontar webhook definitivo

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
