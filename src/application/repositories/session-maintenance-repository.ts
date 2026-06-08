export interface SessionMaintenanceRepository {
  deleteOlderThan(days: number): Promise<number>;
}
