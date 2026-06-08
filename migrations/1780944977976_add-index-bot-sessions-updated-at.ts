import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("bot_sessions", "updated_at", {
    name: "idx_bot_sessions_updated_at",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("bot_sessions", "updated_at", {
    name: "idx_bot_sessions_updated_at",
  });
}
