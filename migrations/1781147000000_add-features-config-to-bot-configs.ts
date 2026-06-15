import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("bot_configs", {
    features_config: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
  });

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
    }'::jsonb
    WHERE webhook_token IN ('qos-prod', 'qos-test-bot');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("bot_configs", ["features_config"]);
}
