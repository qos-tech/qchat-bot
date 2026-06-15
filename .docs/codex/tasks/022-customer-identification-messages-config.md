# 022 - Customer Identification Messages Config

Status: DONE

## Objetivo

Remover mensagens hardcoded introduzidas na task 019 e mover toda a comunicação relacionada à identificação do cliente para `messages_config`.

## Contexto

A task 019 introduziu mensagens de identificação do cliente diretamente no código.

Exemplos:

- CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE
- CUSTOMER_IDENTIFICATION_INVALID_MESSAGE
- mensagens montadas dinamicamente para transferência

Isso viola a arquitetura atual do projeto, onde:

- menus → banco
- mensagens → banco
- comportamentos → features_config
- lógica → código

Cada bot deve poder personalizar os textos sem necessidade de deploy.

## Requisitos

### 1. Remover mensagens hardcoded

Identificar e remover constantes relacionadas a:

```text
CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE
CUSTOMER_IDENTIFICATION_INVALID_MESSAGE
```

e qualquer outra mensagem fixa criada exclusivamente para a funcionalidade de identificação.

A lógica permanece no código.

O texto passa a ser carregado do BotConfig.

---

### 2. Adicionar novas chaves em messages_config

Adicionar suporte às seguintes mensagens:

```json
{
  "customer_identification_prompt": "...",
  "customer_identification_invalid": "...",
  "customer_identification_transfer_template": "..."
}
```

---

### 3. Defaults seguros

Quando a chave não existir, utilizar fallback interno.

#### customer_identification_prompt

```text
Para adiantar seu atendimento, informe o nome da sua empresa ou o CNPJ.
```

#### customer_identification_invalid

```text
Não consegui identificar a informação enviada.

Por favor, informe o nome da empresa ou o CNPJ.
```

#### customer_identification_transfer_template

```text
Identificação do cliente: {{value}}
```

---

### 4. Template de transferência

Permitir substituição de:

```text
{{value}}
```

Exemplo:

Template:

```text
Identificação do cliente: {{value}}
```

Valor:

```text
Banapneus
```

Resultado:

```text
Identificação do cliente: Banapneus
```

Outro exemplo:

```text
Cliente informado: {{value}}
```

Resultado:

```text
Cliente informado: 12345678000190
```

---

### 5. Compatibilidade

Bots que ainda não possuírem essas mensagens:

- devem continuar funcionando
- devem usar os fallbacks internos

Nenhuma migração obrigatória de dados.

---

### 6. Atualizar documentação

Atualizar:

```text
README.md
.docs/architecture/new-bot-onboarding.md
```

Documentando as novas mensagens.

Adicionar exemplos de configuração.

---

### 7. Atualizar Health Check

Atualizar:

```text
bot:health
```

para validar:

```text
customer_identification_prompt
customer_identification_invalid
customer_identification_transfer_template
```

Somente quando:

```json
{
  "customerIdentification": {
    "enabled": true
  }
}
```

Se estiver desabilitado:

- não exigir essas mensagens

---

### 8. Testes

Adicionar testes para:

#### Configuração completa

Mensagens presentes.

#### Configuração ausente

Fallback funcionando.

#### Template

Substituição correta de:

```text
{{value}}
```

---

## Critérios de aceite

- npm run build passa
- testes passam
- nenhuma mensagem de identificação fica hardcoded
- todos os textos passam a vir de messages_config
- bots antigos continuam funcionando
- bot:health valida as novas mensagens apenas quando necessário
- task marcada como DONE
