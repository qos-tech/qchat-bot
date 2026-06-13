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
      'QoS Produção',
      'qos-prod',

      1,
      127,
      true,

      'https://api.qchat.qosit.cloud',
      'w45m4zw5196cfp1qiff7h',

      'https://api.evolution.qosit.cloud',
      'FC654925C4AF-4ECE-8E49-151D631BBB3F',
      '4120182200',

      '{
        "triageQueueId": "46",
        "supportQueueId": "1",
        "financeQueueId": "3",
        "otherQueueId": "2"
      }'::jsonb,

      '{
        "timezone": "America/Sao_Paulo",
        "morningStart": "08:30",
        "morningEnd": "12:00",
        "afternoonStart": "13:00",
        "afternoonEnd": "17:30"
      }'::jsonb,

      '{}'::jsonb,
      '{}'::jsonb
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
    WHERE webhook_token = 'qos-prod';
  `);
}
