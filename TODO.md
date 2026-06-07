# TODO - QChat Bot

## Status Atual

### Concluído

- [x] Normalizador QChat
- [x] Repositório de sessões PostgreSQL
- [x] Menus principais
- [x] Menu financeiro
- [x] Menu fora do horário
- [x] Regras de horário comercial
- [x] Regras fora do horário
- [x] Roteamento para filas
- [x] Integração Evolution (botões)
- [x] Integração QChat (transferência)
- [x] Testes manuais dos fluxos
- [x] Testes reais Evolution
- [x] Testes reais QChat

---

## MVP

### Bootstrap da aplicação

- [ ] Criar `src/bootstrap/create-handle-incoming-message-use-case.ts`
- [ ] Instanciar `PostgresConversationSessionRepository`
- [ ] Instanciar `EvolutionMessagingGateway`
- [ ] Instanciar `QChatTicketTransferGateway`
- [ ] Instanciar `BusinessHoursService`
- [ ] Instanciar `HandleIncomingMessageUseCase`

### HTTP

- [ ] Criar `src/server.ts`
- [ ] Criar rota `POST /webhook/qchat`
- [ ] Criar endpoint `GET /health`
- [ ] Integrar webhook → normalizer → use case

### Teste ponta a ponta

- [ ] Receber mensagem real do QChat
- [ ] Criar sessão no PostgreSQL
- [ ] Enviar menu via Evolution
- [ ] Receber clique do botão
- [ ] Transferir ticket no QChat
- [ ] Validar fluxo completo

---

## Produção

### Configuração

- [ ] Validar variáveis de ambiente no startup
- [ ] Revisar `.env.example`
- [ ] Documentar configuração

### Logs

- [ ] Log de mensagem recebida
- [ ] Log de sessão criada
- [ ] Log de menu enviado
- [ ] Log de transferência realizada
- [ ] Log de erros externos

### Tratamento de erros

- [ ] Melhorar erros da Evolution
- [ ] Melhorar erros do QChat
- [ ] Definir estratégia de retry

### Banco

- [ ] Revisar índices
- [ ] Revisar constraints
- [ ] Planejar limpeza de sessões antigas

---

## Deploy

- [ ] Criar Dockerfile
- [ ] Criar docker-compose.yml
- [ ] Definir estratégia de execução (PM2/Systemd)
- [ ] Configurar healthcheck do container

---

## Evoluções Futuras

### Financeiro

- [ ] Consulta de boleto
- [ ] Consulta de NF
- [ ] Consulta por CNPJ

### GLPI

- [ ] Abrir chamado
- [ ] Consultar chamado
- [ ] Atualizar chamado

### IA

- [ ] RAG
- [ ] Base de conhecimento
- [ ] Classificação automática de intenção

### Multiempresa

- [ ] Filas por empresa
- [ ] Horários por empresa
- [ ] Menus por empresa
- [ ] Mensagens por empresa

### Observabilidade

- [ ] Métricas
- [ ] Dashboard
- [ ] Alertas
- [ ] Monitoramento

---

## Filas Atuais

```text
Triagem     = 46
Suporte     = 1
Outros      = 2
Financeiro  = 3
```

## Horário Comercial

```text
Segunda a Sexta
08:30 às 12:00
13:00 às 17:30

Feriados nacionais = fechado
```

## Fluxo Atual

```text
QChat
↓
Webhook
↓
Normalizer
↓
UseCase
↓
PostgreSQL

├─ Evolution (menus)
└─ QChat (transferências)
```
