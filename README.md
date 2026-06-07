# QChat Bot

Bot de triagem para integração com QChat, desenvolvido em Node.js + TypeScript seguindo princípios de Clean Architecture.

## Objetivos

- Automatizar o primeiro atendimento ao cliente.
- Direcionar solicitações para as filas corretas.
- Respeitar horário comercial.
- Permitir expansão futura para Evolution, API Oficial e outros provedores.
- Manter a regra de negócio desacoplada do provedor de mensagens.

---

# Fluxo Geral

```text
Mensagem recebida
        │
        ▼
QChatPayloadNormalizer
        │
        ▼
HandleIncomingMessageUseCase
        │
        ▼
fromMe?
├─ Sim → Ignora
└─ Não

        ▼
userId preenchido?
├─ Sim → Ignora
└─ Não

        ▼
queueId == TRIAGE_QUEUE_ID?
├─ Não → Ignora
└─ Sim

        ▼
BusinessHoursService

        ▼
Horário comercial?
├─ Não → Fluxo fora do horário
└─ Sim → Fluxo normal
```

---

# Fluxo Normal

## Primeiro contato

```text
Cliente envia qualquer mensagem
↓
Cria sessão
↓
Envia menu principal
```

### Menu Principal

- Suporte Técnico
- Financeiro
- Outros Assuntos

---

## Suporte Técnico

```text
Cliente seleciona Suporte Técnico
↓
Sessão → waiting_human
↓
Move ticket para fila de suporte
↓
Envia mensagem de confirmação
```

---

## Financeiro

```text
Cliente seleciona Financeiro
↓
Sessão → awaiting_finance_menu
↓
Envia submenu financeiro
```

### Submenu Financeiro

- 2ª Via NF
- 2ª Via Boleto
- Outros

### 2ª Via NF

```text
Cliente seleciona opção
↓
Sessão → waiting_human
↓
Move ticket para fila financeira
↓
Envia confirmação
```

### 2ª Via Boleto

```text
Cliente seleciona opção
↓
Sessão → waiting_human
↓
Move ticket para fila financeira
↓
Envia confirmação
```

### Outros Assuntos Financeiros

```text
Cliente seleciona opção
↓
Sessão → waiting_human
↓
Move ticket para fila financeira
↓
Envia confirmação
```

---

## Outros Assuntos

```text
Cliente seleciona Outros Assuntos
↓
Sessão → waiting_human
↓
Move ticket para fila correspondente
↓
Envia confirmação
```

---

# Loop de Menus

Enquanto o cliente não selecionar uma opção válida:

## Menu Principal

```text
Texto
Áudio
Imagem
Vídeo
Documento
Sticker
Localização
Contato

↓

Reenvia menu principal
```

## Menu Financeiro

```text
Texto
Áudio
Imagem
Vídeo
Documento
Sticker
Localização
Contato

↓

Reenvia submenu financeiro
```

---

# Fluxo Fora do Horário

## Horário de Atendimento

Segunda a Sexta:

- 08:30 às 12:00
- 13:00 às 17:30

Fechado:

- Sábados
- Domingos
- Feriados nacionais

---

## Comportamento

```text
Cliente envia mensagem
↓
Envia menu fora do horário
```

### Menu Fora do Horário

- Suporte Técnico
- Financeiro
- Outros Assuntos

---

## Seleção de opção

```text
Cliente escolhe opção
↓
Registra intenção
↓
Move ticket para fila correspondente
↓
Sessão → waiting_human
↓
Mensagem:
"Sua solicitação foi registrada.
Nossa equipe retornará no próximo horário útil."
```

---

# Sessões

As sessões são controladas por:

```text
ticketId
```

Cada ticket representa uma conversa independente.

Novos tickets ou reaberturas iniciam um novo fluxo de atendimento.

---

# Estados da Conversa

```text
awaiting_main_menu
awaiting_finance_menu
waiting_human
```

---

# Tipos de Mensagem Suportados

```text
text
button
image
audio
video
document
sticker
location
contact
reaction
unknown
```

---

# Arquitetura

```text
Webhook
↓
QChatPayloadNormalizer
↓
HandleIncomingMessageUseCase
↓
BusinessHoursService
↓
ConversationSessionRepository
↓
MessagingGateway
↓
TicketRoutingGateway
```

---

# Decisões Arquiteturais

- Sessões são controladas por `ticketId`.
- Todo primeiro atendimento deve chegar na fila de Triagem.
- O bot processa apenas tickets da fila de Triagem.
- `userId` preenchido significa atendimento humano.
- O bot ignora mensagens enviadas por ele próprio (`fromMe = true`).
- Fora do horário o cliente continua sendo direcionado para a fila final escolhida.
- O bot é agnóstico ao provedor de mensagens.
- Toda integração externa deve ocorrer através de Gateways.
- A regra de negócio não deve conhecer detalhes da API do QChat.

---

# Estrutura do Projeto

```text
src/
├── application/
│   ├── services/
│   ├── use-cases/
│   └── menus/
│
├── domain/
│   ├── bot/
│   └── messaging/
│
├── infrastructure/
│   ├── database/
│   ├── providers/
│   ├── repositories/
│   └── services/
│
└── presentation/
    └── http/
```

---

# Objetivos Futuros

- Um ticket por conversa.
- Integração com Evolution API.
- Integração com WhatsApp Cloud API.
- Configuração de horários por empresa.
- Configuração dinâmica de menus.
- Integração com ERP para consultas financeiras.
- Integração com GLPI para abertura e consulta de chamados.
- Base de conhecimento com IA.
