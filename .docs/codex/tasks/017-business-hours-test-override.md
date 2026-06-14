# 017 - Business Hours Test Override

Status: DONE

## Objetivo

Criar um override operacional para forçar o status de horário comercial durante testes.

## Contexto

Hoje o bot decide entre:

- menu `main`
- menu `after_hours`

com base no serviço de horário comercial.

Em produção, precisamos validar rapidamente os dois fluxos sem alterar banco, código ou horário real.

## Variável de ambiente

Adicionar suporte a:

```env
BUSINESS_HOURS_OVERRIDE=
```
