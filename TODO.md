# TODO - QChat Bot

## Produção

- [ ] Revisar estratégia de backup PostgreSQL
- [ ] Avaliar índices após crescimento real

---

# v1.1 - Multiempresa / Multibot

## v1.1.0 - Webhook Dinâmico e Configuração de Bots

### Concluído

- [x] Criar branch `release/v1.1`
- [x] Criar tabela `bot_configs`
- [x] Criar `webhook_token` por bot
- [x] Criar campos JSONB de configuração
- [x] Criar `BotConfig`
- [x] Criar `BotConfigRepository`
- [x] Criar `PostgresBotConfigRepository`
- [x] Criar seed inicial da QoS
- [x] Criar `BotConfigResolver`
- [x] Resolver configuração por `webhookToken`
- [x] Resolver configuração por `companyId` + `whatsappId`
- [x] Criar rota `/webhook/qchat/:webhookToken`
- [x] Validar webhook dinâmico com `qos-prod`

### Pendente

- [ ] Fazer rota dinâmica usar `BotContext` no UseCase
- [ ] Remover dependência de `QueueConfig` fixo na rota dinâmica
- [ ] Manter rota antiga compatível durante transição

---

## v1.1.1 - Menus e Fluxos Configuráveis

### Concluído

- [x] Redesenhar `BotContext` genérico
- [x] Criar tipos `BotMenu`, `BotMenuButton` e `BotMenuAction`
- [x] Criar `BotContextMapper`
- [x] Criar configuração dinâmica inicial de menus
- [x] Criar configuração dinâmica inicial de mensagens
- [x] Criar `MenuResolver`
- [x] Criar `MenuToButtonMessage`
- [x] Validar menu dinâmico com teste manual

### Pendente

- [ ] Alterar `HandleIncomingMessageUseCase` para aceitar `BotContext`
- [ ] Enviar menu principal a partir de `menus_config`
- [ ] Enviar menu fora de horário a partir de `menus_config`
- [ ] Enviar submenu a partir de ação `send_menu`
- [ ] Transferir fila a partir de ação `transfer`
- [ ] Buscar mensagem de confirmação por `messageKey`
- [ ] Remover regras hardcoded de `option_support`
- [ ] Remover regras hardcoded de `option_finance`
- [ ] Remover regras hardcoded de `option_others`
- [ ] Remover regras hardcoded de `finance_nf`
- [ ] Remover regras hardcoded de `finance_invoice`
- [ ] Remover regras hardcoded de `finance_others`

---

## v1.1.2 - Multi Instância

- [ ] Evolution URL por bot
- [ ] Evolution API Key por bot
- [ ] Evolution Instance por bot
- [ ] QChat URL por bot
- [ ] QChat Token por bot
- [ ] Gateways dinâmicos por `BotContext`
- [ ] Remover dependência fixa de ENV para Evolution
- [ ] Remover dependência fixa de ENV para QChat

---

## v1.1.3 - Administração

- [ ] Seeds por ambiente
- [ ] Exportação de configuração
- [ ] Importação de configuração
- [ ] Templates de configuração
- [ ] Documentação de configuração de novo bot

---

## v1.1.4 - Estabilização

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

## Versão estável

✅ v1.0.0

## Branch atual

`release/v1.1`

## Objetivo atual

Transformar o bot único da QoS em uma base multiempresa/multibot configurável.
