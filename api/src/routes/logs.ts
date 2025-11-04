import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Log } from '../db/types.js';

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function logRoutes(fastify: FastifyInstance) {
  // Get all logs with pagination (no filter)
  fastify.get<{ 
    Querystring: { page?: number; limit?: number };
    Reply: { logs: Log[]; total: number; page: number; limit: number; totalPages: number }
  }>(
    '/logs',
    async (request) => {
      const { page, limit } = paginationQuerySchema.parse(request.query);
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = fastify.db
        .prepare('SELECT COUNT(*) as count FROM logs')
        .get() as { count: number };
      const total = countResult.count;
      
      // Get paginated logs
      const logs = fastify.db
        .prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .all(limit, offset) as Log[];
      
      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  );

  // Get logs for webhook with pagination
  fastify.get<{ 
    Params: { webhook_id: number }; 
    Querystring: { page?: number; limit?: number };
    Reply: { logs: Log[]; total: number; page: number; limit: number; totalPages: number }
  }>(
    '/logs/:webhook_id',
    async (request) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      const { page, limit } = paginationQuerySchema.parse(request.query);
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = fastify.db
        .prepare('SELECT COUNT(*) as count FROM logs WHERE webhook_id = ?')
        .get(webhook_id) as { count: number };
      const total = countResult.count;
      
      // Get paginated logs
      const logs = fastify.db
        .prepare('SELECT * FROM logs WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .all(webhook_id, limit, offset) as Log[];
      
      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  );
}

