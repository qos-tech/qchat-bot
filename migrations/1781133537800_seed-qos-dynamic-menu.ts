import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET
      messages_config = '{
        "support_confirmation": "Recebemos sua solicitação e ela foi encaminhada para nosso time. Em instantes um atendente irá auxiliá-lo.",
        "finance_confirmation": "Só um momento enquanto transfiro pra nosso time. Para adiantar o seu atendimento, nos informe o nome da sua Empresa ou CNPJ:",
        "other_confirmation": "Recebemos sua solicitação e ela foi encaminhada para nosso time.",
        "after_hours_support_confirmation": "Recebemos sua solicitação e ela foi encaminhada para nosso time. Nosso horário de atendimento, neste canal, é de segunda a sexta-feira, das 08:30 às 12:00 e das 13:00 às 17:30. Caso se trate de uma emergência, pedimos que entre em contato pelo telefone (41) 4063-7066. Caso contrário, responderemos no próximo horário útil.",
        "after_hours_other_confirmation": "Recebemos sua solicitação e ela foi encaminhada para nosso time. Nosso horário de atendimento, neste canal, é de segunda a sexta-feira, das 08:30 às 12:00 e das 13:00 às 17:30. Responderemos no próximo horário útil."
      }'::jsonb,

      menus_config = '{
        "main": {
          "id": "main",
          "title": "Olá! Você está no atendimento da QoS 📞☁️",
          "description": "Agradecemos seu contato! 👋\\n\\nSelecione uma das opções abaixo:",
          "buttons": [
            {
              "id": "option_support",
              "label": "Suporte Técnico",
              "action": {
                "type": "transfer",
                "queueId": "1",
                "intent": "support",
                "messageKey": "support_confirmation"
              }
            },
            {
              "id": "option_finance",
              "label": "Financeiro",
              "action": {
                "type": "send_menu",
                "menuId": "finance"
              }
            },
            {
              "id": "option_others",
              "label": "Outros Assuntos",
              "action": {
                "type": "transfer",
                "queueId": "2",
                "intent": "other",
                "messageKey": "other_confirmation"
              }
            }
          ]
        },

        "finance": {
          "id": "finance",
          "title": "Assuntos Financeiros 🧾",
          "description": "Selecione uma das opções abaixo:",
          "buttons": [
            {
              "id": "finance_nf",
              "label": "2ª via NF",
              "action": {
                "type": "transfer",
                "queueId": "3",
                "intent": "finance_nf",
                "messageKey": "finance_confirmation"
              }
            },
            {
              "id": "finance_invoice",
              "label": "2ª via Boleto",
              "action": {
                "type": "transfer",
                "queueId": "3",
                "intent": "finance_invoice",
                "messageKey": "finance_confirmation"
              }
            },
            {
              "id": "finance_others",
              "label": "Outros",
              "action": {
                "type": "transfer",
                "queueId": "3",
                "intent": "finance_other",
                "messageKey": "finance_confirmation"
              }
            }
          ]
        },

        "after_hours": {
          "id": "after_hours",
          "title": "Olá! Você está no atendimento da QoS 📞☁️",
          "description": "Agradecemos seu contato! 👋\\n\\nNo momento, nosso time está atendendo apenas emergências por telefone, mas responderemos sua mensagem no próximo expediente. 🗓️\\n\\nSelecione uma opção abaixo para nos deixar um recado! ✨",
          "buttons": [
            {
              "id": "option_support",
              "label": "Suporte Técnico",
              "action": {
                "type": "transfer",
                "queueId": "1",
                "intent": "support",
                "messageKey": "after_hours_support_confirmation"
              }
            },
            {
              "id": "option_others",
              "label": "Outros Assuntos",
              "action": {
                "type": "transfer",
                "queueId": "2",
                "intent": "other",
                "messageKey": "after_hours_other_confirmation"
              }
            }
          ]
        }
      }'::jsonb,

      updated_at = now()
    WHERE webhook_token = 'qos-prod';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET
      messages_config = '{}'::jsonb,
      menus_config = '{}'::jsonb,
      updated_at = now()
    WHERE webhook_token = 'qos-prod';
  `);
}
