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

### Testes

- [x] Repository
- [x] Business Hours
- [x] Use Case
- [x] Evolution Real
- [x] QChat Real
- [x] Bootstrap

---

# MVP

## HTTP

- [ ] Criar servidor Fastify
- [ ] Criar rota GET /health
- [ ] Criar rota POST /webhook/qchat

## Integração

- [ ] Integrar Webhook → Normalizer
- [ ] Integrar Normalizer → UseCase
- [ ] Tratar erros do webhook

## Teste Ponta a Ponta

- [ ] Receber mensagem do QChat
- [ ] Criar sessão PostgreSQL
- [ ] Enviar menu Evolution
- [ ] Receber clique do botão
- [ ] Transferir ticket no QChat
- [ ] Validar fluxo completo

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

- [ ] Criar servidor Fastify
- [ ] Criar GET /health
- [ ] Criar POST /webhook/qchat
