import { FastifyInstance } from 'fastify';
import type { LogCleanupService } from '../services/log-cleanup.js';

declare module 'fastify' {
  interface FastifyInstance {
    logCleanup: LogCleanupService;
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  /**
   * Get log cleanup statistics
   */
  fastify.get('/admin/logs/cleanup/stats', async () => {
    return fastify.logCleanup.getStats();
  });

  /**
   * Manually trigger log cleanup
   */
  fastify.post('/admin/logs/cleanup/trigger', async () => {
    fastify.logCleanup.cleanup();
    return { 
      message: 'Log cleanup triggered successfully',
      timestamp: new Date().toISOString()
    };
  });
}

