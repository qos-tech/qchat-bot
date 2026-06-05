import { MigrationBuilder } from "node-pg-migrate";

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("bot_sessions", {
    id: "id",

    provider: {
      type: "varchar(30)",
      notNull: true,
    },

    company_id: {
      type: "varchar(50)",
      notNull: false,
    },

    whatsapp_id: {
      type: "varchar(50)",
      notNull: false,
    },

    ticket_id: {
      type: "varchar(50)",
      notNull: true,
    },

    contact_id: {
      type: "varchar(50)",
      notNull: false,
    },

    phone: {
      type: "varchar(30)",
      notNull: true,
    },

    stage: {
      type: "varchar(50)",
      notNull: true,
    },

    intent: {
      type: "varchar(50)",
      notNull: false,
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

  pgm.createIndex("bot_sessions", ["ticket_id"], {
    unique: true,
  });

  pgm.createIndex("bot_sessions", ["phone"]);
  pgm.createIndex("bot_sessions", ["stage"]);
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable("bot_sessions");
}
