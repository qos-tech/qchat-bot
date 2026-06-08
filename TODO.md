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

# Produção

## Configuração

- [ ] Validar ENV no startup
- [ ] Revisar .env.example

## Logs

- [ ] Log de mensagem recebida
- [ ] Log de sessão criada
- [ ] Log de menu enviado
- [ ] Log de transferência

## Erros

- [ ] Tratamento de erro Evolution
- [ ] Tratamento de erro QChat

---

# Deploy

- [ ] Dockerfile
- [ ] docker-compose.yml
- [ ] Healthcheck container

---

# Melhorias Futuras

## Sessões

- [ ] Limpeza automática de sessões antigas

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

# Próxima Tarefa

- [ ] Criar validação de ENV no startup
- [ ] Criar `src/config/env.ts`
- [ ] Validar variáveis obrigatórias com Zod
- [ ] Substituir usos diretos de `process.env` por `env`
- [ ] Testar startup com ENV válido
- [ ] Testar startup com ENV faltando
