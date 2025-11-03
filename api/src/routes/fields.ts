import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { extractFieldsWithInfo, type FieldInfo } from '../utils/field-extractor.js';

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

export async function fieldRoutes(fastify: FastifyInstance) {
  /**
   * Get available source fields from the latest webhook payload
   * This helps users see what fields are available for mapping
   */
  fastify.get<{ 
    Params: { webhook_id: number }; 
    Reply: { fields: FieldInfo[] } | { error: string } 
  }>(
    '/fields/:webhook_id',
    async (request, reply) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      
      // Get the latest log for this webhook
      const latestLog = fastify.db
        .prepare(`
          SELECT payload 
          FROM logs 
          WHERE webhook_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `)
        .get(webhook_id) as { payload: string } | undefined;
      
      if (!latestLog) {
        return reply.code(404).send({ 
          error: 'No logs found for this webhook. Send a test webhook first to see available fields.' 
        });
      }
      
      try {
        const payload = JSON.parse(latestLog.payload);
        const fields = extractFieldsWithInfo(payload);
        
        return { fields };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to parse webhook payload');
        return reply.code(500).send({ 
          error: 'Failed to parse webhook payload' 
        });
      }
    }
  );

  /**
   * Extract fields from a custom JSON payload
   * Useful for testing before sending an actual webhook
   */
  fastify.post<{ 
    Body: { payload: any }; 
    Reply: { fields: FieldInfo[] } 
  }>(
    '/fields/extract',
    async (request) => {
      const { payload } = request.body;
      const fields = extractFieldsWithInfo(payload);
      
      return { fields };
    }
  );
}

