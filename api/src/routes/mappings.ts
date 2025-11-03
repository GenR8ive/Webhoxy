import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Mapping, MappingCreateRequest } from '../db/types.js';

const createMappingSchema = z.object({
  webhook_id: z.number(),
  source_field: z.string(),
  target_field: z.string(),
  fixed_value: z.string().nullable().optional(),
});

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

const mappingIdParamsSchema = z.object({
  mapping_id: z.coerce.number(),
});

export async function mappingRoutes(fastify: FastifyInstance) {
  // Create mapping
  fastify.post<{ Body: MappingCreateRequest; Reply: Mapping }>(
    '/mappings',
    async (request, reply) => {
      const body = createMappingSchema.parse(request.body);
      
      // Check if webhook exists
      const webhook = fastify.db
        .prepare('SELECT id FROM webhooks WHERE id = ?')
        .get(body.webhook_id);
      
      if (!webhook) {
        return reply.notFound('Webhook not found');
      }
      
      const stmt = fastify.db.prepare(`
        INSERT INTO mappings (webhook_id, source_field, target_field, fixed_value)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        body.webhook_id,
        body.source_field,
        body.target_field,
        body.fixed_value ?? null
      );
      
      const mappingId = result.lastInsertRowid as number;
      
      const mapping = fastify.db
        .prepare('SELECT * FROM mappings WHERE id = ?')
        .get(mappingId) as Mapping;
      
      return mapping;
    }
  );

  // Get mappings for webhook
  fastify.get<{ Params: { webhook_id: number }; Reply: Mapping[] }>(
    '/mappings/:webhook_id',
    async (request) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      
      const mappings = fastify.db
        .prepare('SELECT * FROM mappings WHERE webhook_id = ? ORDER BY id')
        .all(webhook_id) as Mapping[];
      
      return mappings;
    }
  );

  // Delete mapping
  fastify.delete<{ Params: { mapping_id: number } }>(
    '/mappings/:mapping_id',
    async (request, reply) => {
      const { mapping_id } = mappingIdParamsSchema.parse(request.params);
      
      const result = fastify.db
        .prepare('DELETE FROM mappings WHERE id = ?')
        .run(mapping_id);
      
      if (result.changes === 0) {
        return reply.notFound('Mapping not found');
      }
      
      reply.code(204).send();
    }
  );
}

