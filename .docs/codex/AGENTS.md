# AGENTS.md

## Projeto

QChat Bot - bot de triagem multiempresa integrado ao QChat e Evolution API.

## Branch atual

Trabalhar na branch:

release/v1.1

## Regras obrigatórias

- Não quebrar a rota antiga `/webhook/qchat`.
- A rota dinâmica é `/webhook/qchat/:webhookToken`.
- Quando não existir BotContext, o fluxo legado deve continuar funcionando.
- Quando existir BotContext, o fluxo deve usar configuração dinâmica.
- Rodar `npm run build` antes de finalizar qualquer tarefa.
- Rodar testes manuais relacionados à alteração.
- Não misturar múltiplas features na mesma tarefa.
- Manter mudanças pequenas e revisáveis.

## Arquitetura

- `domain` não deve importar `infrastructure`.
- `application` pode depender de `domain`.
- `infrastructure` implementa gateways e repositories.
- `presentation` lida apenas com HTTP.
- UseCases devem continuar testáveis com mocks.

## Objetivo da v1.1

Transformar o bot único da QoS em uma base multiempresa/multibot configurável.
