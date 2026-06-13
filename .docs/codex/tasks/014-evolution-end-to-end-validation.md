# 014 - Evolution End-to-End Validation

Status: DONE

## Objetivo

Validar o fluxo completo de entrada via Evolution.

## Cenários obrigatórios

### 1. Texto sem sessão

Entrada:

- provider Evolution
- mensagem de texto
- sem sessão existente

Esperado:

- resolve BotConfig por Evolution instance
- cria BotContext
- envia menu
- salva sessão `awaiting_main_menu`

### 2. Clique de botão

Entrada:

- provider Evolution
- botão configurado no menu

Esperado:

- resolve botão via BotContext
- executa action `transfer`
- transfere no QChat usando número
- salva sessão `waiting_human`

### 3. Sessão waiting_human + ticket aberto

Entrada:

- sessão existente `waiting_human`
- ticket QChat mais recente com status `open` ou `pending`

Esperado:

- não responde
- não apaga sessão
- mantém atendimento humano

### 4. Sessão waiting_human + ticket fechado

Entrada:

- sessão existente `waiting_human`
- ticket QChat mais recente com status `closed`

Esperado:

- apaga sessão
- reinicia fluxo
- envia menu novo

## Requisitos

- Criar ou atualizar teste manual para cobrir os 4 cenários.
- Usar doubles/mocks para Evolution, QChat e lookup de ticket.
- Não depender de APIs externas reais.
- Não depender de dados reais do QChat.
- Não alterar regra do status `close`.
- Não alterar schema do banco.
- Não implementar feature nova.

## Critérios de aceite

- `npm run build` passa.
- Teste manual passa.
- Logs/outputs deixam claro cada cenário.
- Status da task atualizado para DONE.
