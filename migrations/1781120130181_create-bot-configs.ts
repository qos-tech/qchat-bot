import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("uuid-ossp", {
    ifNotExists: true,
  });

  pgm.createTable("bot_configs", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },

    name: {
      type: "varchar(100)",
      notNull: true,
    },

    webhook_token: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },

    company_id: {
      type: "integer",
      notNull: false,
    },

    whatsapp_id: {
      type: "integer",
      notNull: false,
    },

    active: {
      type: "boolean",
      notNull: true,
      default: true,
    },

    qchat_api_url: {
      type: "text",
      notNull: true,
    },

    qchat_api_token: {
      type: "text",
      notNull: true,
    },

    evolution_api_url: {
      type: "text",
      notNull: true,
    },

    evolution_api_key: {
      type: "text",
      notNull: true,
    },

    evolution_instance: {
      type: "text",
      notNull: true,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },

    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("bot_configs", "webhook_token", {
    name: "idx_bot_configs_webhook_token",
    unique: true,
  });

  pgm.createIndex("bot_configs", ["company_id", "whatsapp_id"], {
    name: "idx_bot_configs_company_whatsapp",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("bot_configs");
  pgm.dropExtension("uuid-ossp", {
    ifExists: true,
  });
}
