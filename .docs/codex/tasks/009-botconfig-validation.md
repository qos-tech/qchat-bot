# 009 - BotConfig Validation

Status: DONE

## Objetivo

Garantir que BotConfig inválidos sejam rejeitados antes de chegar ao runtime.

## Motivação

Hoje menus, mensagens, filas e integrações são carregados do banco.

Um JSON inválido pode quebrar o fluxo durante a execução do bot.

A validação deve ocorrer no carregamento da configuração.

## Requisitos

### Criar validador

Criar:

src/application/config/bot-config-validator.ts

Responsável por validar:

- BotConfig
- Menus
- Mensagens
- Evolution
- QChat

### Campos obrigatórios

#### Bot

- id
- name
- webhookToken
- active

#### Evolution

- apiUrl
- apiKey
- instance

#### QChat

- apiUrl
- apiToken

#### Menus

Cada menu deve possuir:

- id
- title
- buttons

#### Botões

Cada botão deve possuir:

- id
- label
- action

#### Action

Tipos permitidos:

- send_menu
- transfer

### Regras

#### send_menu

Obrigatório:

- menuId

#### transfer

Obrigatório:

- queueId
- intent
- messageKey

### Mensagens

Todo messageKey utilizado em transfer deve existir em messages.

### Menus

Todo menuId utilizado em send_menu deve existir.

### Falhas

Gerar erro claro:

Exemplos:

Menu "finance" não encontrado

Message "support_confirmation" não encontrada

Botão "option_support" inválido

Evolution.instance obrigatório

### Integração

Executar validação:

- ao carregar BotConfigRepository
  ou
- no BotConfigResolver

Escolher o ponto mais adequado.

### Testes

Criar testes para:

- config válida
- menu inexistente
- mensagem inexistente
- evolution inválida
- qchat inválido

## Critérios de aceite

- build passa
- configs inválidas falham antes do runtime
- mensagens de erro são claras
- bots válidos continuam funcionando
