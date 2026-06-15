import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET messages_config = messages_config || '{
      "customer_identification_prompt": "Para adiantar seu atendimento, informe a sua empresa ou o CNPJ.",
      "customer_identification_invalid": "Não consegui identificar a informação enviada. Por favor, informe o nome da empresa ou o CNPJ.",
      "customer_identification_transfer_template": "Identificação do cliente: {{value}}"
    }'::jsonb
    WHERE webhook_token IN ('qos-prod', 'qos-test-bot');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET messages_config = messages_config
      - 'customer_identification_prompt'
      - 'customer_identification_invalid'
      - 'customer_identification_transfer_template'
    WHERE webhook_token IN ('qos-prod', 'qos-test-bot');
  `);
}
