import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET features_config = '{
      "customerIdentification": {
        "enabled": true,
        "requiredBeforeTransfer": true
      },
      "qchatTicketLifecycle": {
        "enabled": true,
        "openStatuses": ["open"],
        "closedStatuses": ["closed"],
        "pendingStatuses": ["pending"],
        "resumeWhenPendingInTriage": true
      }
    }'::jsonb,
    messages_config = messages_config || '{
      "customer_identification_prompt": "Para adiantar seu atendimento, informe a sua empresa ou o CNPJ.",
      "customer_identification_invalid": "Não consegui identificar a informação enviada. Por favor, informe o nome da empresa ou o CNPJ.",
      "customer_identification_transfer_template": "Identificação do cliente: {{value}}"
    }'::jsonb
    WHERE (company_id, whatsapp_id) IN ((1, 127), (2, 228));
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET features_config = '{}'::jsonb,
        messages_config = messages_config
          - 'customer_identification_prompt'
          - 'customer_identification_invalid'
          - 'customer_identification_transfer_template'
    WHERE (company_id, whatsapp_id) IN ((1, 127), (2, 228));
  `);
}
