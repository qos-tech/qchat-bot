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
      'QoS Test Bot',
      'qos-test-bot',

      2,
      228,
      true,

      'https://api.qchat.test.local',
      'test-qchat-token-qos-test-bot',

      'https://api.evolution.qosit.cloud',
      'test-evolution-api-key-qos-test-bot',
      'qos-test-bot-instance-228',

      '{
        "triageQueueId": "146",
        "supportQueueId": "101",
        "financeQueueId": "103",
        "otherQueueId": "102"
      }'::jsonb,

      '{
        "timezone": "America/Sao_Paulo",
        "morningStart": "09:00",
        "morningEnd": "12:30",
        "afternoonStart": "14:00",
        "afternoonEnd": "18:00"
      }'::jsonb,

      '{
        "support_confirmation": "[TEST BOT] Encaminhamos sua conversa para o suporte de homologacao.",
        "finance_confirmation": "[TEST BOT] Vamos transferir para o financeiro de homologacao. Informe empresa ou CNPJ.",
        "other_confirmation": "[TEST BOT] Encaminhamos sua solicitacao para a fila de assuntos gerais.",
        "after_hours_support_confirmation": "[TEST BOT] Suporte de homologacao fora do horario. Responderemos no proximo periodo util.",
        "after_hours_other_confirmation": "[TEST BOT] Atendimento de homologacao fora do horario. Responderemos no proximo periodo util."
      }'::jsonb,

      '{
        "main": {
          "id": "main",
          "title": "[TEST BOT] Atendimento Multibot",
          "description": "Menu exclusivo do segundo bot para validacao visual. Escolha uma opcao:",
          "buttons": [
            {
              "id": "test_support",
              "label": "Teste Suporte",
              "action": {
                "type": "transfer",
                "queueId": "101",
                "intent": "support_test",
                "messageKey": "support_confirmation"
              }
            },
            {
              "id": "test_finance",
              "label": "Teste Financeiro",
              "action": {
                "type": "send_menu",
                "menuId": "finance"
              }
            },
            {
              "id": "test_other",
              "label": "Teste Geral",
              "action": {
                "type": "transfer",
                "queueId": "102",
                "intent": "other_test",
                "messageKey": "other_confirmation"
              }
            }
          ]
        },

        "finance": {
          "id": "finance",
          "title": "[TEST BOT] Financeiro Homologacao",
          "description": "Menu financeiro diferente do qos-prod para validar multibot:",
          "buttons": [
            {
              "id": "test_finance_nf",
              "label": "Teste NF",
              "action": {
                "type": "transfer",
                "queueId": "103",
                "intent": "finance_nf_test",
                "messageKey": "finance_confirmation"
              }
            },
            {
              "id": "test_finance_invoice",
              "label": "Teste Boleto",
              "action": {
                "type": "transfer",
                "queueId": "103",
                "intent": "finance_invoice_test",
                "messageKey": "finance_confirmation"
              }
            },
            {
              "id": "test_finance_other",
              "label": "Teste Outro Financeiro",
              "action": {
                "type": "transfer",
                "queueId": "103",
                "intent": "finance_other_test",
                "messageKey": "finance_confirmation"
              }
            }
          ]
        },

        "after_hours": {
          "id": "after_hours",
          "title": "[TEST BOT] Fora do Horario",
          "description": "Menu fora do horario exclusivo do segundo bot. Deixe seu recado de teste:",
          "buttons": [
            {
              "id": "test_support",
              "label": "Recado Suporte Teste",
              "action": {
                "type": "transfer",
                "queueId": "101",
                "intent": "support_test",
                "messageKey": "after_hours_support_confirmation"
              }
            },
            {
              "id": "test_other",
              "label": "Recado Geral Teste",
              "action": {
                "type": "transfer",
                "queueId": "102",
                "intent": "other_test",
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
    WHERE webhook_token = 'qos-test-bot';
  `);
}
