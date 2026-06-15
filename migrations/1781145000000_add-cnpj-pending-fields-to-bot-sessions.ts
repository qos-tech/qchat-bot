import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("bot_sessions", {
    pending_action: {
      type: "varchar(50)",
      notNull: false,
    },
    pending_queue_id: {
      type: "varchar(50)",
      notNull: false,
    },
    pending_intent: {
      type: "varchar(50)",
      notNull: false,
    },
    pending_message_key: {
      type: "varchar(100)",
      notNull: false,
    },
    cnpj: {
      type: "varchar(14)",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("bot_sessions", [
    "pending_action",
    "pending_queue_id",
    "pending_intent",
    "pending_message_key",
    "cnpj",
  ]);
}
