# 020 - Bot Runtime Behavior Config

Status: DONE

## Objetivo

Mover comportamentos operacionais do bot para configuração por bot no banco de dados.

## Contexto

Hoje alguns comportamentos estão fixos no código:

1. Customer Identification
   - após a task 019, a etapa de identificação está sempre ativa em todo fluxo dinâmico.

2. QChat Ticket Lifecycle
   - a regra de waiting_human usa status open/pending/closed e triageQueueId de forma fixa no código.

Como a plataforma é multibot, esses comportamentos devem ser configuráveis por bot.

## Modelo de configuração

Adicionar suporte a um campo de configuração no BotConfig.

Preferência:

```ts
features: {
  customerIdentification: {
    enabled: boolean;
    requiredBeforeTransfer: boolean;
  };
  qchatTicketLifecycle: {
    enabled: boolean;
    openStatuses: string[];
    closedStatuses: string[];
    pendingStatuses: string[];
    resumeWhenPendingInTriage: boolean;
  };
}
```
