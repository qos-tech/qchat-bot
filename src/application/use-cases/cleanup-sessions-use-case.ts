import type { SessionMaintenanceRepository } from "../repositories/session-maintenance-repository.js";

export class CleanupSessionsUseCase {
  constructor(private readonly repository: SessionMaintenanceRepository) {}

  async execute(days = 7): Promise<number> {
    return this.repository.deleteOlderThan(days);
  }
}
