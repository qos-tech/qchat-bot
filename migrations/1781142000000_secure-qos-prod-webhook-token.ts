import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET
      webhook_token = uuid_generate_v4()::text,
      updated_at = now()
    WHERE webhook_token = 'qos-prod';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE bot_configs
    SET
      webhook_token = 'qos-prod',
      updated_at = now()
    WHERE company_id = 1
      AND whatsapp_id = 127
      AND name = 'QoS Produção';
  `);
}
