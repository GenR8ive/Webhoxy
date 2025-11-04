import type { FastifyBaseLogger } from 'fastify';

export class LogCleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(
    private db: any,
    private retentionDays: number,
    private cleanupIntervalHours: number,
    private logger: FastifyBaseLogger
  ) {}

  /** 
   * Start the automatic cleanup scheduler
   */
  start(): void {
    if (this.intervalId) {
      this.logger.warn('Log cleanup service is already running');
      return;
    }

    this.logger.info({
      retentionDays: this.retentionDays,
      cleanupIntervalHours: this.cleanupIntervalHours
    }, 'Starting log cleanup service');

    // Run cleanup immediately on start
    this.cleanup();

    // Schedule periodic cleanup
    const intervalMs = this.cleanupIntervalHours * 60 * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * Stop the automatic cleanup scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Log cleanup service stopped');
    }
  }

  /**
   * Perform cleanup of old logs
   */
  cleanup(): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      const cutoffDateStr = cutoffDate.toISOString();

      this.logger.info({ cutoffDate: cutoffDateStr }, 'Running log cleanup');

      // Delete logs older than retention period
      const result = this.db
        .prepare('DELETE FROM logs WHERE created_at < ?')
        .run(cutoffDateStr);

      const deletedCount = result.changes;

      if (deletedCount > 0) {
        this.logger.info({ deletedCount }, 'Deleted old logs');
      } else {
        this.logger.debug('No old logs to delete');
      }

      // Optimize database (reclaim space)
      this.db.pragma('optimize');
      this.db.exec('VACUUM');
      
      this.logger.info('Log cleanup completed successfully');
    } catch (error: any) {
      this.logger.error({ error }, 'Failed to cleanup old logs');
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats(): { retentionDays: number; cleanupIntervalHours: number; nextCleanup: string | null } {
    return {
      retentionDays: this.retentionDays,
      cleanupIntervalHours: this.cleanupIntervalHours,
      nextCleanup: this.intervalId ? new Date(Date.now() + this.cleanupIntervalHours * 60 * 60 * 1000).toISOString() : null
    };
  }
}

export function createLogCleanupService(
  db: any,
  retentionDays: number,
  cleanupIntervalHours: number,
  logger: FastifyBaseLogger
): LogCleanupService {
  return new LogCleanupService(db, retentionDays, cleanupIntervalHours, logger);
}

