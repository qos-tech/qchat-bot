# TODO - QChat Bot

## Último Marco Concluído

### Core

- [x] Normalizador QChat
- [x] Repositório PostgreSQL
- [x] Business Hours Service
- [x] Bootstrap da aplicação

### Fluxos

- [x] Menu principal
- [x] Menu financeiro
- [x] Menu fora do horário

### Horário Comercial

- [x] Suporte
- [x] Financeiro
- [x] Outros

### Fora do Horário

- [x] Suporte
- [x] Outros

### Integrações

- [x] Evolution Messaging Gateway
- [x] QChat Ticket Transfer Gateway

### HTTP

- [x] Criar servidor Fastify
- [x] Criar rota GET /health
- [x] Criar rota POST /webhook/qchat

### Webhook

- [x] Integrar Webhook → Normalizer
- [x] Integrar Normalizer → UseCase
- [x] Tratar erros do webhook
- [x] Corrigir payload real do QChat
- [x] Suportar payload direto e payload encapsulado

### Configuração

- [x] Criar src/config/env.ts
- [x] Validar variáveis obrigatórias com Zod
- [x] Substituir usos diretos de process.env por env
- [x] Validar ENV no startup
- [x] Testar startup com ENV válido

### Proteções

- [x] Ignorar mensagens enviadas pelo próprio sistema
- [x] Ignorar tickets já atribuídos a operadores
- [x] Ignorar tickets fora da fila de triagem
- [x] Ignorar sessões em waiting_human
- [x] Evitar transferências duplicadas
- [x] Evitar mudança de estado após falha de integração
- [x] Recuperar tickets reutilizados pelo QChat
- [x] Resetar sessões waiting_human ao retornar para triagem

### Tratamento de Erros

- [x] Melhorar tratamento de erro Evolution
- [x] Melhorar tratamento de erro QChat
- [x] Criar ExternalApiError
- [x] Diferenciar erro interno (500) de erro externo (502)
- [x] Logar erros externos com contexto
- [x] Padronizar mensagens de erro
- [x] Validar respostas HTTP
- [x] Validar respostas JSON de erro
- [ ] Definir estratégia de retry

### Observabilidade

#### Logs Estruturados

- [x] Log de mensagem recebida
- [x] Log de sessão criada
- [x] Log de sessão atualizada
- [x] Log de menu enviado
- [x] Log de transferência realizada
- [x] Log de mensagens ignoradas
- [x] Log de erros externos

### Manutenção

- [x] Criar índice em bot_sessions.updated_at
- [x] Criar SessionMaintenanceRepository
- [x] Criar PostgresSessionMaintenanceRepository
- [x] Criar CleanupSessionsUseCase
- [x] Criar script cleanup:sessions
- [x] Tornar retenção configurável por ENV
- [x] Testar limpeza de sessões

### Deploy

- [x] Criar Dockerfile
- [x] Criar .dockerignore
- [x] Criar docker-compose.yml
- [x] Configurar variáveis de ambiente
- [x] Configurar healthcheck
- [x] Testar build local
- [x] Testar execução via Docker
- [x] Executar migrations dentro do container
- [x] Testar deploy em servidor

### Testes

- [x] Repository
- [x] Business Hours
- [x] Use Case
- [x] Evolution Real
- [x] QChat Real
- [x] Bootstrap
- [x] Webhook inicial real
- [x] Falha simulada Evolution
- [x] Falha simulada QChat
- [x] Ticket reutilizado após fechamento

---

# MVP

## Teste Ponta a Ponta

- [x] Receber mensagem do QChat
- [x] Criar sessão PostgreSQL
- [x] Enviar menu Evolution
- [x] Receber clique do botão
- [x] Transferir ticket no QChat
- [x] Validar fluxo completo
- [x] Validar reabertura de atendimento

---

# Próxima Tarefa

## Observabilidade Avançada

- [ ] Criar correlation ID por ticket
- [ ] Incluir ticketId em todos os logs relevantes
- [ ] Padronizar formato dos logs do UseCase
- [ ] Padronizar formato dos logs dos gateways
- [ ] Facilitar rastreio completo de um atendimento

---

# Produção

## Manutenção

- [ ] Agendar limpeza de sessões via cron do host
- [ ] Documentar comando cleanup:sessions
- [ ] Definir retenção padrão em produção

## Banco

- [ ] Revisar constraints
- [ ] Revisar política de backup

## Resiliência

- [ ] Estratégia de retry
- [ ] Timeout configurável por integração
- [ ] Circuit breaker (futuro)

## Nginx / SSL

- [ ] Configurar domínio público
- [ ] Configurar proxy reverso
- [ ] Configurar certificado SSL
- [ ] Apontar webhook do QChat para URL pública

---

# Melhorias Futuras

## Financeiro

- [ ] Consulta de boleto
- [ ] Consulta de NF
- [ ] Consulta por CNPJ

## GLPI

- [ ] Abrir chamado
- [ ] Consultar chamado
- [ ] Atualizar chamado

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

# Próximo Marco

Implementar correlation ID por ticket para rastreamento completo dos atendimentos.
