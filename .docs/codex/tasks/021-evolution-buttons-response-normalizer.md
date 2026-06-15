# 021 - Evolution Buttons Response Normalizer

Status: DONE

## Objetivo

Corrigir o EvolutionPayloadNormalizer para reconhecer corretamente cliques reais de botões enviados pela Evolution API.

## Contexto

Durante os testes em produção foi identificado que, ao clicar em um botão enviado pelo bot, o webhook da Evolution recebe corretamente o evento, porém o normalizador não reconhece o payload.

Como consequência, o sistema registra:

```text
kind: unknown
buttonId: undefined
```

e o fluxo interpreta o clique como uma mensagem comum, reenviando o menu ao invés de executar a action configurada.

## Evidência observada

Logs do sistema:

```text
[BOT] message_received {
  kind: 'unknown',
  buttonId: undefined
}
```

Payload real recebido da Evolution:

```json
{
  "event": "messages.upsert",
  "instance": "4140637066",
  "data": {
    "message": {
      "buttonsResponseMessage": {
        "selectedButtonId": "option_support",
        "selectedDisplayText": "Suporte Técnico"
      }
    },
    "messageType": "buttonsResponseMessage"
  }
}
```

## Objetivo funcional

Quando o usuário clicar em um botão enviado pelo bot, o sistema deve interpretar corretamente:

```text
option_support
```

como:

```text
kind = button
buttonId = option_support
buttonText = Suporte Técnico
```

permitindo que o fluxo continue normalmente.

---

## Requisitos

### 1. Atualizar EvolutionPayloadNormalizer

Arquivo:

```text
src/infrastructure/providers/evolution/evolution-payload-normalizer.ts
```

Adicionar suporte explícito para:

```text
buttonsResponseMessage
```

Detectar:

```ts
data.message.buttonsResponseMessage;
```

ou

```ts
data.messageType === "buttonsResponseMessage";
```

---

### 2. Extrair corretamente os dados

Quando existir:

```json
{
  "buttonsResponseMessage": {
    "selectedButtonId": "option_support",
    "selectedDisplayText": "Suporte Técnico"
  }
}
```

mapear para:

```ts
kind: "button";
buttonId: "option_support";
buttonText: "Suporte Técnico";
text: "Suporte Técnico";
isButtonReply: true;
```

---

### 3. Preservar metadados existentes

Continuar extraindo normalmente:

```ts
conversationId;
messageId;
phone;
fromMe;
provider;
instance;
```

sem alterações de comportamento.

---

### 4. Compatibilidade retroativa

Não remover suporte aos formatos já existentes:

```text
conversation
extendedTextMessage
templateButtonReplyMessage
listResponseMessage
interactiveResponseMessage
```

ou qualquer outro formato já suportado.

O ajuste deve ser apenas aditivo.

---

### 5. Fixture real

Criar:

```text
tests/fixtures/evolution/button-real.json
```

Baseado no payload real capturado.

Remover apenas:

```text
apikey
server_url
destination
```

se necessário.

Manter a estrutura original do clique.

---

### 6. Atualizar testes

Arquivo:

```text
tests/manual/test-evolution-normalizer.ts
```

Adicionar cenário:

```text
buttonsResponseMessage
```

Validações esperadas:

```ts
kind === "button";

buttonId === "option_support";

buttonText === "Suporte Técnico";

text === "Suporte Técnico";

isButtonReply === true;
```

Também validar:

```ts
phone;
conversationId;
messageId;
instance;
```

---

### 7. Regressão

Garantir que os cenários já existentes continuam funcionando:

```text
Texto comum
Botão legado
Lista
Mídia
```

Sem regressões.

---

## Validação

Executar:

```bash
npm run build
```

Executar:

```bash
npm run test:evolution-normalizer
```

---

## Critérios de aceite

- `npm run build` passa.
- `npm run test:evolution-normalizer` passa.
- Payload real de `buttonsResponseMessage` não retorna mais `kind: unknown`.
- `buttonId` é corretamente identificado.
- O fluxo de clique de botão volta a funcionar.
- Não há regressão em mensagens de texto.
- Task marcada como `DONE`.
