import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { extractFieldsWithInfo, type FieldInfo } from '../utils/field-extractor.js';
import { authenticateUser, requirePasswordChange } from '../middleware/auth.js';

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

export async function fieldRoutes(fastify: FastifyInstance) {
  /**
   * Get stored source fields for a webhook
   */
  fastify.get<{ 
    Params: { webhook_id: number }; 
    Reply: { fields: FieldInfo[] }
  }>(
    '/fields/:webhook_id/stored',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      
      const storedFields = fastify.db
        .prepare(`
          SELECT field_path as path, field_type as type, sample_value as sample
          FROM source_fields 
          WHERE webhook_id = ?
          ORDER BY is_custom ASC, created_at ASC
        `)
        .all(webhook_id) as FieldInfo[];
      
      return { fields: storedFields };
    }
  );

  /**
   * Get available source fields from the latest webhook payload
   * This also saves the fields for future reference
   */
  fastify.get<{ 
    Params: { webhook_id: number }; 
    Reply: { fields: FieldInfo[] } | { error: string } 
  }>(
    '/fields/:webhook_id',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request, reply) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      
      // Get the latest log for this webhook
      const latestLog = fastify.db
        .prepare(`
          SELECT source_payload, payload 
          FROM logs 
          WHERE webhook_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `)
        .get(webhook_id) as { source_payload: string | null; payload: string } | undefined;
      
      if (!latestLog) {
        return reply.code(404).send({ 
          error: 'No logs found for this webhook. Send a test webhook first to see available fields.' 
        });
      }
      
      try {
        // Use source_payload if available (new format), otherwise fall back to payload (old format)
        const payloadString = latestLog.source_payload || latestLog.payload;
        const payload = JSON.parse(payloadString);
        const fields = extractFieldsWithInfo(payload);
        
        // Store/update these fields in the database
        const insertStmt = fastify.db.prepare(`
          INSERT OR REPLACE INTO source_fields (webhook_id, field_path, field_type, sample_value, is_custom)
          VALUES (?, ?, ?, ?, 0)
        `);
        
        for (const field of fields) {
          insertStmt.run(webhook_id, field.path, field.type, field.sample ? String(field.sample) : null);
        }
        
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
   * Save a custom field added by the user
   */
  fastify.post<{ 
    Params: { webhook_id: number };
    Body: { field_path: string }; 
    Reply: { success: boolean } 
  }>(
    '/fields/:webhook_id/custom',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      const { field_path } = request.body;
      
      fastify.db.prepare(`
        INSERT OR IGNORE INTO source_fields (webhook_id, field_path, field_type, is_custom)
        VALUES (?, ?, 'custom', 1)
      `).run(webhook_id, field_path);
      
      return { success: true };
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
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request) => {
      const { payload } = request.body;
      const fields = extractFieldsWithInfo(payload);
      
      return { fields };
    }
  );
}

