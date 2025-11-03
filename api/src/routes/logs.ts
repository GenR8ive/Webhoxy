import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Log } from '../db/types.js';

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

export async function logRoutes(fastify: FastifyInstance) {
  // Get logs for webhook
  fastify.get<{ Params: { webhook_id: number }; Reply: Log[] }>(
    '/logs/:webhook_id',
    async (request) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      
      const logs = fastify.db
        .prepare('SELECT * FROM logs WHERE webhook_id = ? ORDER BY created_at DESC')
        .all(webhook_id) as Log[];
      
      return logs;
    }
  );
}

