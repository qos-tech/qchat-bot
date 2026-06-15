import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("bot_sessions", {
    customer_identification: {
      type: "varchar(255)",
      notNull: false,
    },
    identification_type: {
      type: "varchar(20)",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("bot_sessions", [
    "customer_identification",
    "identification_type",
  ]);
}
