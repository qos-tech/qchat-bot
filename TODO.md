# TODO - QChat Bot

## Produção

- [ ] Revisar estratégia de backup PostgreSQL
- [ ] Avaliar índices após crescimento real

---

# v1.1 - Multiempresa / Multibot

## v1.1.0 - Webhook Dinâmico e Configuração de Bots

### Objetivo

Desacoplar o sistema de uma única empresa e permitir múltiplos bots independentes.

### Entregas

- [ ] Criar tabela `bot_configs`
- [ ] Criar `webhook_token` por bot
- [ ] Criar rota `/webhook/qchat/:webhookToken`
- [ ] Resolver configuração do bot pelo webhook
- [ ] Validar bot ativo/inativo
- [ ] Fallback para webhook inválido
- [ ] Remover dependência de configuração única por ENV

---

## v1.1.1 - Configuração Dinâmica

### Objetivo

Permitir que cada bot possua suas próprias regras.

### Entregas

- [ ] Filas por bot
- [ ] Horários por bot
- [ ] Mensagens por bot
- [ ] Retenção por bot
- [ ] Configuração centralizada em banco

---

## v1.1.2 - Multi Instância

### Objetivo

Permitir integrações independentes por bot.

### Entregas

- [ ] Evolution URL por bot
- [ ] Evolution API Key por bot
- [ ] Evolution Instance por bot
- [ ] QChat URL por bot
- [ ] QChat Token por bot

---

## v1.1.3 - Menus Configuráveis

### Objetivo

Remover menus hardcoded.

### Entregas

- [ ] Menu principal configurável
- [ ] Menu financeiro configurável
- [ ] Menu fora do horário configurável
- [ ] Botões configuráveis
- [ ] Textos configuráveis
- [ ] Ordem configurável

---

## v1.1.4 - Fluxos Configuráveis

### Objetivo

Permitir diferentes comportamentos por cliente.

### Entregas

- [ ] Transferências configuráveis
- [ ] Submenus configuráveis
- [ ] Intents configuráveis
- [ ] Mensagens configuráveis
- [ ] Regras por opção

---

## v1.1.5 - Administração

### Objetivo

Facilitar manutenção e implantação.

### Entregas

- [ ] Seeds iniciais
- [ ] Exportação de configuração
- [ ] Importação de configuração
- [ ] Documentação
- [ ] Templates de configuração

---

## v1.1.6 - Estabilização

### Objetivo

Preparar a plataforma para integrações futuras.

### Entregas

- [ ] Testes finais
- [ ] Refatorações
- [ ] Revisão de migrations
- [ ] Revisão de performance
- [ ] Release v1.1

---

# Roadmap Futuro

## v1.2 - GLPI

- [ ] Validar usuário por telefone
- [ ] Buscar usuário
- [ ] Abrir chamado
- [ ] Consultar chamado
- [ ] Atualizar chamado
- [ ] Encerrar chamado

## v1.3 - Base de Conhecimento

- [ ] Base documental
- [ ] Busca semântica
- [ ] RAG
- [ ] Respostas assistidas

## v1.4 - IA

- [ ] Classificação automática
- [ ] Sugestões automáticas
- [ ] Ações automáticas
- [ ] Agentes especializados

---

# Status Atual

## Versão

✅ v1.0.0

## Estado

✅ Produção

## MVP

Concluído e validado em ambiente real.

### Entregas da v1.0.0

- Webhook QChat
- Evolution API
- PostgreSQL
- Menus
- Horário comercial
- Fora do horário
- Transferência automática
- Sessões
- Retry
- Correlation ID
- Observabilidade
- Docker
- SSL
- Produção
- Cleanup automático

### Próxima Versão

➡️ v1.1 - Multiempresa / Multibot
