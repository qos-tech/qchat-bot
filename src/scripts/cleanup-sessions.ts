import { env } from "../config/env.js";
import { CleanupSessionsUseCase } from "../application/use-cases/cleanup-sessions-use-case.js";
import { PostgresSessionMaintenanceRepository } from "../infrastructure/repositories/postgres-session-maintenance-repository.js";

const repository = new PostgresSessionMaintenanceRepository();
const cleanupSessions = new CleanupSessionsUseCase(repository);

const removed = await cleanupSessions.execute(env.SESSION_RETENTION_DAYS);

console.log(
  `[CLEANUP] ${removed} sessões removidas (retenção: ${env.SESSION_RETENTION_DAYS} dias)`,
);

process.exit(0);
