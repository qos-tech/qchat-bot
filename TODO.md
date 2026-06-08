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

### Testes

- [x] Repository
- [x] Business Hours
- [x] Use Case
- [x] Evolution Real
- [x] QChat Real
- [x] Bootstrap
- [x] Webhook inicial real

---

# MVP

## Teste Ponta a Ponta

- [x] Receber mensagem do QChat
- [x] Criar sessão PostgreSQL
- [x] Enviar menu Evolution
- [x] Receber clique do botão
- [x] Transferir ticket no QChat
- [x] Validar fluxo completo

---

# Próxima Tarefa

## Tratamento de Erros

- [ ] Melhorar tratamento de erro Evolution
- [ ] Melhorar tratamento de erro QChat
- [ ] Logar erros externos com contexto
- [ ] Padronizar mensagens de erro
- [ ] Definir estratégia de retry

---

# Observabilidade

## Logs Estruturados

- [x] Log de mensagem recebida
- [x] Log de sessão criada
- [x] Log de sessão atualizada
- [x] Log de menu enviado
- [x] Log de transferência realizada
- [x] Log de mensagens ignoradas

### Pendente

- [ ] Log de erros externos
- [ ] Padronização completa dos logs
- [ ] Correlation ID por ticket
- [ ] Métricas básicas

---

# Produção

## Banco

- [ ] Revisar índices
- [ ] Revisar constraints
- [ ] Planejar limpeza automática de sessões

---

# Deploy

- [ ] Dockerfile
- [ ] docker-compose.yml
- [ ] Healthcheck do container
- [ ] Build de produção
- [ ] Guia de deploy

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

# Filas

- Triagem: 46
- Suporte: 1
- Outros: 2
- Financeiro: 3

# Horário Comercial

- Segunda a Sexta
- 08:30 às 12:00
- 13:00 às 17:30
- Feriados nacionais: fechado

# Arquitetura Atual

QChat
↓
Webhook Fastify
↓
Normalizer
↓
HandleIncomingMessageUseCase
↓
PostgreSQL

├─ Evolution (Menus)
└─ QChat (Transferências)

# Próximo Marco

Tratamento de erros dos gateways externos (Evolution e QChat) com logs completos e preparação para ambiente de produção.
