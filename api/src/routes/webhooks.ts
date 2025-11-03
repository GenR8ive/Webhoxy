import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { DB, Webhook, WebhookCreateRequest, WebhookResponse } from '../db/types.js';
import { forwardWebhook } from '../services/forwarder.js';
import { applyMappings } from '../utils/json-mapper.js';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  target_url: z.string().url(),
});

const webhookParamsSchema = z.object({
  id: z.coerce.number(),
});

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

declare module 'fastify' {
  interface FastifyInstance {
    db: DB;
  }
}

export async function webhookRoutes(fastify: FastifyInstance) {
  // Create webhook
  fastify.post<{ Body: WebhookCreateRequest; Reply: WebhookResponse }>(
    '/webhooks',
    async (request, reply) => {
      const body = createWebhookSchema.parse(request.body);
      
      try {
        const stmt = fastify.db.prepare(`
          INSERT INTO webhooks (name, description, target_url)
          VALUES (?, ?, ?)
        `);
        
        const result = stmt.run(body.name, body.description, body.target_url);
        const webhookId = result.lastInsertRowid as number;
        
        const proxyUrl = `http://localhost:${process.env.PORT || 8080}/hook/${webhookId}`;
        
        return { id: webhookId, proxy_url: proxyUrl };
      } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return reply.conflict('Source URL already exists');
        }
        throw error;
      }
    }
  );

  // List all webhooks
  fastify.get<{ Reply: Webhook[] }>('/webhooks', async () => {
    const webhooks = fastify.db
      .prepare('SELECT * FROM webhooks ORDER BY created_at DESC')
      .all() as Webhook[];
    
    return webhooks;
  });

  // Get webhook by ID
  fastify.get<{ Params: { id: number }; Reply: Webhook }>(
    '/webhooks/:id',
    async (request, reply) => {
      const { id } = webhookParamsSchema.parse(request.params);
      
      const webhook = fastify.db
        .prepare('SELECT * FROM webhooks WHERE id = ?')
        .get(id) as Webhook | undefined;
      
      if (!webhook) {
        return reply.notFound('Webhook not found');
      }
      
      return webhook;
    }
  );

  // Delete webhook
  fastify.delete<{ Params: { id: number } }>(
    '/webhooks/:id',
    async (request, reply) => {
      const { id } = webhookParamsSchema.parse(request.params);
      
      const result = fastify.db
        .prepare('DELETE FROM webhooks WHERE id = ?')
        .run(id);
      
      if (result.changes === 0) {
        return reply.notFound('Webhook not found');
      }
      
      reply.code(204).send();
    }
  );

  // Receive and forward webhook (proxy endpoint)
  fastify.post<{ Params: { webhook_id: number }; Body: any }>(
    '/hook/:webhook_id',
    async (request, reply) => {
      const { webhook_id } = webhookIdParamsSchema.parse(request.params);
      const payload = request.body;
      
      fastify.log.info({ webhook_id }, 'Received webhook');
      
      // Get webhook configuration
      const webhook = fastify.db
        .prepare('SELECT * FROM webhooks WHERE id = ?')
        .get(webhook_id) as Webhook | undefined;
      
      if (!webhook) {
        return reply.notFound('Webhook not found');
      }
      
      // Get mappings
      const mappings = fastify.db
        .prepare('SELECT * FROM mappings WHERE webhook_id = ?')
        .all(webhook_id) as any[];
      
      // Apply mappings if any exist
      const transformedPayload = mappings.length > 0
        ? applyMappings(payload, mappings)
        : payload;
      
      // Forward to target URL
      try {
        const { statusCode, responseBody } = await forwardWebhook(
          fastify.db,
          webhook_id,
          webhook.target_url,
          transformedPayload,
          fastify.log
        );
        
        if (statusCode >= 200 && statusCode < 300) {
          reply.code(200).send({ status: 'delivered' });
        } else {
          fastify.log.error({ statusCode, webhook_id }, 'Target returned error status');
          reply.code(502).send({ error: 'Bad Gateway' });
        }
      } catch (error) {
        fastify.log.error({ error, webhook_id }, 'Failed to forward webhook');
        reply.code(502).send({ error: 'Failed to forward webhook' });
      }
    }
  );
}

