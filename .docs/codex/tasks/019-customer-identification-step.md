# 019 - Customer Identification Step

Status: DONE

## Objetivo

Adicionar uma etapa de identificação do cliente antes da transferência para atendimento humano.

## Contexto

Hoje o fluxo funciona assim:

Cliente
↓
Menu
↓
Suporte / Financeiro / Outros
↓
Transferência imediata
↓
Mensagem pedindo empresa ou CNPJ

O problema é que a informação do cliente não é capturada nem estruturada.

A partir desta task, o bot deve coletar a identificação antes da transferência.

## Fluxo esperado

Cliente
↓
Seleciona opção
↓
Bot solicita identificação
↓
Cliente responde
↓
Bot salva identificação
↓
Bot transfere
↓
QChat recebe a informação junto com a transferência

## Tipos aceitos

O usuário pode responder:

- Nome da empresa
- Razão social
- Nome fantasia
- CNPJ com máscara
- CNPJ sem máscara

Exemplos:

Banapneus

QoS Information Technology

12.345.678/0001-90

12345678000190

## Nova etapa de sessão

Adicionar:

```text
awaiting_customer_identification
```

## Dados da sessão

A sessão deve armazenar:

```ts
customerIdentification: string;
identificationType: "company_name" | "cnpj";

pendingQueueId: string;
pendingIntent: string;
pendingMessageKey: string;
```

A implementação pode adaptar os nomes conforme o padrão existente.

## Detecção automática

Quando o cliente responder:

### CNPJ

Se o valor possuir 14 dígitos numéricos válidos após normalização:

```text
identificationType = cnpj
```

Salvar:

```text
12345678000190
```

sem máscara.

### Nome da empresa

Qualquer outro valor:

```text
identificationType = company_name
```

Salvar exatamente como informado.

## Alteração do fluxo de transferência

Quando action.type = transfer e existir BotContext:

Não transferir imediatamente.

Em vez disso:

- salvar os dados pendentes
- mudar sessão para awaiting_customer_identification
- solicitar identificação

Mensagem:

Para adiantar seu atendimento, informe o nome da sua empresa ou CNPJ.

Exemplos:

• Banapneus
• QoS Information Technology
• 12.345.678/0001-90

## Após receber a identificação

O bot deve:

- detectar o tipo
- salvar na sessão
- executar a transferência pendente
- enviar a mensagem configurada normalmente
- mudar para waiting_human

## Informações enviadas ao QChat

A mensagem de transferência deve incluir a identificação capturada.

Exemplo:

Identificação informada pelo cliente:

Tipo: company_name
Valor: Banapneus

Só um momento enquanto transfiro pra nosso time.

Ou:

Identificação informada pelo cliente:

Tipo: cnpj
Valor: 12345678000190

Só um momento enquanto transfiro pra nosso time.

## Compatibilidade

Não alterar:

- Evolution webhook
- QChat webhook legado
- ticket lookup
- waiting_human
- business hours
- menus_config
- messages_config

## Não implementar nesta task

Não fazer:

- consulta GLPI
- consulta Receita Federal
- consulta banco de clientes
- confirmação de empresa
- matching de entidade

Isso será feito nas próximas tasks.

## Atualizações documentais

Atualizar:

- .docs/codex/BACKLOG.md
- .docs/codex/ROADMAP.md

Criando formalmente:

Epic 3 - Customer Identification

### Roadmap

v1.3

- Customer Identification
- Customer Resolver
- Customer Confirmation

## Testes

Criar testes cobrindo:

- empresa informada
- CNPJ com máscara
- CNPJ sem máscara
- transferência após identificação
- sessão awaiting_customer_identification
- waiting_human após transferência

Adicionar script:

npm run test:customer-identification

## Critérios de aceite

- npm run build passa
- testes passam
- identificação é salva corretamente
- transferência continua funcionando
- task marcada como DONE
