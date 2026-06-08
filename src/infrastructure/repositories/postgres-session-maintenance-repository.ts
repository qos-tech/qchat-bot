import type { SessionMaintenanceRepository } from "../../application/repositories/session-maintenance-repository.js";
import { db } from "../database/db.js";

export class PostgresSessionMaintenanceRepository implements SessionMaintenanceRepository {
  async deleteOlderThan(days: number): Promise<number> {
    const result = await db.query(
      `
      DELETE FROM bot_sessions
      WHERE updated_at < now() - ($1 || ' days')::interval
      `,
      [days],
    );

    return result.rowCount ?? 0;
  }
}
