# 016 - After Hours Active Menu Resolution

Status: DONE

## Objetivo

Corrigir a resolução de botões quando o atendimento está fora do horário.

## Contexto

No fluxo Evolution/QoS, o menu exibido fora do horário está correto:

- `after_hours`

Porém, ao clicar em `option_support`, a mensagem de confirmação enviada está vindo errada.

O comportamento esperado é:

- Menu exibido: `after_hours`
- Botão clicado: `option_support`
- Action usada: `after_hours.buttons.option_support`
- MessageKey usada: `after_hours_support_confirmation`

O comportamento atual indica que o clique pode estar sendo resolvido pelo menu `main`, usando:

- `support_confirmation`

Isso acontece porque a sessão fica com:

```text
stage = awaiting_main_menu
```

mesmo quando o menu enviado foi `after_hours`.

## Requisitos

### 1. Corrigir activeMenuId

Quando `context` existir e a mensagem for clique de botão:

- Se `businessHours.isOpen === false`, o menu ativo para o estágio principal deve ser `after_hours`.
- Se `businessHours.isOpen === true`, o menu ativo para o estágio principal deve ser `main`.

Ou seja:

```text
awaiting_main_menu + isOpen false -> after_hours
awaiting_main_menu + isOpen true  -> main
```

### 2. Não alterar banco

Não alterar:

- `menus_config`
- `messages_config`
- migrations
- seeds

A correção deve ser no fluxo de resolução do menu ativo.

### 3. Não quebrar submenu financeiro

Se a sessão estiver em estágio/estado de financeiro, continuar resolvendo pelo menu `finance`.

### 4. Logs

Adicionar ou ajustar logs para incluir:

- `activeMenuId`
- `buttonId`
- `action.type`
- `messageKey`, quando existir

Exemplo esperado:

```text
[BOT] dynamic_action_resolved {
  activeMenuId: "after_hours",
  buttonId: "option_support",
  actionType: "transfer",
  messageKey: "after_hours_support_confirmation"
}
```

### 5. Testes

Atualizar testes manuais para cobrir:

#### Cenário fora de horário

- `businessHours.isOpen = false`
- sessão `stage = awaiting_main_menu`
- botão `option_support`

Esperado:

- resolver menu `after_hours`
- usar `messageKey = after_hours_support_confirmation`
- transferir para fila configurada
- mensagem enviada deve ser `after_hours_support_confirmation`

#### Cenário dentro do horário

- `businessHours.isOpen = true`
- sessão `stage = awaiting_main_menu`
- botão `option_support`

Esperado:

- resolver menu `main`
- usar `messageKey = support_confirmation`

#### Cenário financeiro

- sessão/stage financeiro
- botão financeiro

Esperado:

- continuar resolvendo menu `finance`

## Critérios de aceite

- `npm run build` passa.
- Teste manual relevante passa.
- Fora do horário, clique em `option_support` usa `after_hours_support_confirmation`.
- Dentro do horário, clique em `option_support` usa `support_confirmation`.
- Submenu financeiro continua funcionando.
