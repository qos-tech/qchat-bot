# Onboarding de Novo Bot

Este guia descreve o processo completo para criar, ativar e validar um novo bot
na arquitetura multibot da v1.1.

## Visao Geral

Um `BotConfig` e a configuracao persistida no banco para um bot especifico. Ele
define o token secreto do webhook dinamico, a empresa, o WhatsApp, as
credenciais das integracoes, filas, mensagens e menus.

Um `BotContext` e a representacao de runtime derivada do `BotConfig`. O fluxo de
atendimento usa esse contexto para carregar menus, mensagens e a fila de triagem
do bot resolvido.

O webhook dinamico recebe mensagens em:

```text
/webhook/qchat/:webhookToken
```

Ao receber uma requisicao, a rota resolve o `BotConfig` pelo `webhookToken`.
Quando encontra um bot ativo, cria os gateways dinamicos com as configuracoes do
bot:

- `EvolutionMessagingGateway(botConfig.evolution)`
- `QChatTicketTransferGateway(botConfig.qchat)`

Depois disso, o `BotConfig` vira `BotContext` e o use case processa a mensagem
com menus, mensagens e filas daquele bot. A rota antiga `/webhook/qchat` continua
usando o fluxo legado baseado em variaveis de ambiente.

## Pre-requisitos

Antes de criar um bot, tenha estes dados confirmados:

- Evolution API: URL base, API key e nome da instance.
- QChat: URL base, token de API, `companyId` e `whatsappId`.
- Banco de dados: acesso para aplicar migrations/seeds.
- Webhook publico: URL publica apontando para a rota dinamica do bot.

Exemplo de webhook publico:

```text
https://bot.exemplo.com/webhook/qchat/3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c
```

O valor final da URL e o `webhook_token`. Trate esse valor como segredo
operacional, da mesma forma que um token de API. Nao use nomes previsiveis em
producao, como `acme-prod` ou `qos-prod`.

## Passo 1 - Criar Instancia Evolution

Crie uma instance exclusiva para o bot na Evolution API.

Dados esperados:

```text
instance: acme-whatsapp-001
apiUrl: https://api.evolution.exemplo.com
apiKey: <EVOLUTION_API_KEY_DO_BOT>
```

Valide a instance antes de usar em producao:

- A instance existe e esta conectada.
- O WhatsApp correto esta pareado.
- A API key tem permissao para enviar mensagens.
- O envio de texto simples funciona.
- O envio de botoes funciona, pois o bot envia menus com botoes.

Teste minimo de envio:

```bash
curl -X POST "$EVOLUTION_API_URL/message/sendText/$EVOLUTION_INSTANCE" \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{"number":"5541999999999","text":"Teste de envio do novo bot"}'
```

## Passo 2 - Criar Integracao QChat

No QChat, confirme os identificadores da empresa e do WhatsApp que originam as
mensagens desse bot.

Dados esperados:

```text
companyId: 10
whatsappId: 501
apiUrl: https://api.qchat.exemplo.com
apiToken: <QCHAT_API_TOKEN_DO_BOT>
```

O `companyId` e o `whatsappId` precisam ser exclusivos para o bot quando a
resolucao por mensagem for usada. O token precisa permitir transferencia/envio
para as filas configuradas no bot.

## Passo 3 - Criar BotConfig

Crie uma migration/seed inserindo uma linha em `bot_configs`.

Campos principais:

- `name`: nome interno do bot.
- `webhook_token`: segredo usado na rota `/webhook/qchat/:webhookToken`.
- `company_id`: empresa no QChat.
- `whatsapp_id`: WhatsApp no QChat.
- `active`: `true` para habilitar o bot.
- `qchat_api_url`: URL base da API QChat.
- `qchat_api_token`: token do QChat.
- `evolution_api_url`: URL base da Evolution API.
- `evolution_api_key`: API key da Evolution.
- `evolution_instance`: instance Evolution usada para enviar menus.
- `queues_config`: filas usadas no fluxo dinamico.
- `business_hours_config`: horario de atendimento.
- `messages_config`: mensagens de confirmacao.
- `menus_config`: menus e acoes do bot.

Exemplo real de teste criado para validar multibot:

```text
webhookToken: qos-test-bot
companyId: 2
whatsappId: 228
evolutionInstance: qos-test-bot-instance-228
triageQueueId: 146
supportQueueId: 101
financeQueueId: 103
otherQueueId: 102
```

Esse exemplo e de homologacao e permanece legivel para facilitar testes. Para
producao, gere um token seguro:

```bash
node -e "console.log(require('node:crypto').randomUUID())"
```

Exemplo:

```text
3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c
```

Nunca reutilize o mesmo `webhook_token` entre bots. Em logs, dashboards e
chamados, use o token mascarado, por exemplo:

```text
3f9e0a7d-****-****-****-9b7d18df5a2c
```

Para listar bots sem expor tokens completos:

```bash
npm run bot:list
```

Para ver o token completo de um bot especifico:

```bash
npm run bot:show -- <botId>
```

Tambem e possivel usar o par exibido na listagem:

```bash
npm run bot:show -- <companyId>:<whatsappId>
```

Para regenerar o token:

```bash
npm run bot:rotate-token -- <botId>
npm run bot:rotate-token -- <companyId>:<whatsappId>
```

O comando de rotacao exibe o token antigo mascarado e o token novo completo.
Atualize imediatamente a URL publica configurada no QChat depois da rotacao.

## Passo 4 - Criar Menus

Os menus ficam em `menus_config`. Cada menu possui `id`, `title`,
`description` e `buttons`.

Cada bot deve ter, no minimo:

- `main`: menu principal.
- `after_hours`: menu fora do horario.

Se o bot tiver submenu financeiro, inclua tambem:

- `finance`: menu financeiro.

Exemplo de menu principal:

```json
{
  "main": {
    "id": "main",
    "title": "[ACME] Atendimento",
    "description": "Escolha uma opcao:",
    "buttons": [
      {
        "id": "acme_support",
        "label": "Suporte",
        "action": {
          "type": "transfer",
          "queueId": "201",
          "intent": "support",
          "messageKey": "support_confirmation"
        }
      },
      {
        "id": "acme_finance",
        "label": "Financeiro",
        "action": {
          "type": "send_menu",
          "menuId": "finance"
        }
      },
      {
        "id": "acme_other",
        "label": "Outros",
        "action": {
          "type": "transfer",
          "queueId": "202",
          "intent": "other",
          "messageKey": "other_confirmation"
        }
      }
    ]
  }
}
```

Tipos de acao suportados:

- `transfer`: transfere para uma fila QChat e envia uma mensagem.
- `send_menu`: envia outro menu configurado no `menus_config`.

## Passo 5 - Criar Mensagens

As mensagens ficam em `messages_config`. Elas sao referenciadas pelos botoes com
`messageKey`.

Exemplo:

```json
{
  "support_confirmation": "Recebemos sua solicitacao e vamos encaminhar para o suporte.",
  "finance_confirmation": "Vamos encaminhar para o financeiro. Informe empresa ou CNPJ.",
  "other_confirmation": "Recebemos sua solicitacao e vamos encaminhar para atendimento.",
  "after_hours_support_confirmation": "Estamos fora do horario. O suporte respondera no proximo periodo util.",
  "after_hours_other_confirmation": "Estamos fora do horario. Responderemos no proximo periodo util."
}
```

Toda `messageKey` usada em `menus_config` deve existir em `messages_config`.

## Passo 6 - Aplicar Migration/Seed

Crie uma migration em `migrations/` seguindo o padrao:

```text
<timestamp>_seed-<nome-do-bot>.ts
```

Use `INSERT ... ON CONFLICT (webhook_token) DO UPDATE` para permitir reaplicar a
seed com seguranca.

Comando para aplicar:

```bash
npm run migrate:up
```

Depois de aplicar, confirme que a migration entrou na tabela de controle do
`node-pg-migrate` e que a linha existe em `bot_configs`.

## Passo 7 - Validar Bot

Valide o resolver:

```bash
npm run test:bot-config-resolver
```

Valide manualmente:

- `/webhook/qchat/<token-seguro-do-qos>` continua resolvendo o bot QoS.
- `/webhook/qchat/<novo-token>` resolve o novo bot.
- O menu enviado mostra o titulo e os botoes do novo bot.
- As transferencias usam os `queueId` do novo bot.
- O envio do menu usa a `evolution_instance` do novo bot.
- A transferencia usa `qchat_api_url` e `qchat_api_token` do novo bot.

Exemplo de payload de validacao local, adaptando uma fixture QChat:

```text
POST /webhook/qchat/3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c
Content-Type: application/json

<payload QChat com companyId=10, whatsappId=501 e queueId igual a triageQueueId>
```

Se o bot nao resolver:

- Confirme se `active = true`.
- Confirme se o `webhook_token` esta correto sem expor o valor completo em logs
  ou tickets.
- Confirme se a migration foi aplicada no banco usado pela aplicacao.
- Confirme se `company_id` e `whatsapp_id` batem com o payload do QChat.

## Passo 8 - Go Live

Checklist de producao:

- Instance Evolution criada, conectada e testada.
- QChat API URL e token validados.
- `companyId` e `whatsappId` confirmados no QChat.
- Filas de triagem, suporte, financeiro e outros confirmadas.
- Menus revisados com o cliente ou operador.
- Mensagens de confirmacao revisadas.
- `webhookToken` seguro gerado com UUID e armazenado como segredo operacional.
- Webhook publico configurado no QChat:

```text
https://<host-publico>/webhook/qchat/<webhookToken>
```

- `npm run migrate:up` executado no ambiente alvo.
- `npm run test:bot-config-resolver` executado no ambiente alvo, quando houver
  acesso ao banco.
- Teste real de entrada no WhatsApp feito com fila de triagem correta.
- Teste real de transferencia feito para cada fila configurada.
- Logs revisados para confirmar `bot_config_resolved`, `menu_sent` e
  `ticket_transferred`.

## Exemplo de Seed

Use este exemplo como base. Troque nomes, tokens, URLs, filas e mensagens antes
de aplicar em producao. O `webhook_token` abaixo deve ser substituido por um UUID
gerado para o bot real.

```ts
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO bot_configs (
      name,
      webhook_token,
      company_id,
      whatsapp_id,
      active,
      qchat_api_url,
      qchat_api_token,
      evolution_api_url,
      evolution_api_key,
      evolution_instance,
      queues_config,
      business_hours_config,
      messages_config,
      menus_config
    )
    VALUES (
      'ACME Atendimento',
      '3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c',
      10,
      501,
      true,
      'https://api.qchat.exemplo.com',
      '<QCHAT_API_TOKEN_DO_BOT>',
      'https://api.evolution.exemplo.com',
      '<EVOLUTION_API_KEY_DO_BOT>',
      'acme-whatsapp-001',
      '{
        "triageQueueId": "200",
        "supportQueueId": "201",
        "financeQueueId": "203",
        "otherQueueId": "202"
      }'::jsonb,
      '{
        "timezone": "America/Sao_Paulo",
        "morningStart": "08:30",
        "morningEnd": "12:00",
        "afternoonStart": "13:00",
        "afternoonEnd": "17:30"
      }'::jsonb,
      '{
        "support_confirmation": "Recebemos sua solicitacao e vamos encaminhar para o suporte.",
        "finance_confirmation": "Vamos encaminhar para o financeiro. Informe empresa ou CNPJ.",
        "other_confirmation": "Recebemos sua solicitacao e vamos encaminhar para atendimento.",
        "after_hours_support_confirmation": "Estamos fora do horario. O suporte respondera no proximo periodo util.",
        "after_hours_other_confirmation": "Estamos fora do horario. Responderemos no proximo periodo util."
      }'::jsonb,
      '{
        "main": {
          "id": "main",
          "title": "[ACME] Atendimento",
          "description": "Escolha uma opcao:",
          "buttons": [
            {
              "id": "acme_support",
              "label": "Suporte",
              "action": {
                "type": "transfer",
                "queueId": "201",
                "intent": "support",
                "messageKey": "support_confirmation"
              }
            },
            {
              "id": "acme_other",
              "label": "Outros",
              "action": {
                "type": "transfer",
                "queueId": "202",
                "intent": "other",
                "messageKey": "other_confirmation"
              }
            }
          ]
        },
        "after_hours": {
          "id": "after_hours",
          "title": "[ACME] Fora do Horario",
          "description": "Deixe seu recado:",
          "buttons": [
            {
              "id": "acme_support",
              "label": "Recado Suporte",
              "action": {
                "type": "transfer",
                "queueId": "201",
                "intent": "support",
                "messageKey": "after_hours_support_confirmation"
              }
            },
            {
              "id": "acme_other",
              "label": "Recado Outros",
              "action": {
                "type": "transfer",
                "queueId": "202",
                "intent": "other",
                "messageKey": "after_hours_other_confirmation"
              }
            }
          ]
        }
      }'::jsonb
    )
    ON CONFLICT (webhook_token)
    DO UPDATE SET
      name = EXCLUDED.name,
      company_id = EXCLUDED.company_id,
      whatsapp_id = EXCLUDED.whatsapp_id,
      active = EXCLUDED.active,
      qchat_api_url = EXCLUDED.qchat_api_url,
      qchat_api_token = EXCLUDED.qchat_api_token,
      evolution_api_url = EXCLUDED.evolution_api_url,
      evolution_api_key = EXCLUDED.evolution_api_key,
      evolution_instance = EXCLUDED.evolution_instance,
      queues_config = EXCLUDED.queues_config,
      business_hours_config = EXCLUDED.business_hours_config,
      messages_config = EXCLUDED.messages_config,
      menus_config = EXCLUDED.menus_config,
      updated_at = now();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM bot_configs
    WHERE webhook_token = '3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c';
  `);
}
```
