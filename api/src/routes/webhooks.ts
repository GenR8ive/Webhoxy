import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Webhook, WebhookCreateRequest, WebhookResponse, User } from '../db/types.js';
import { forwardWebhook } from '../services/forwarder.js';
import { applyMappings } from '../utils/json-mapper.js';
import { authenticateUser, requirePasswordChange } from '../middleware/auth.js';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  target_url: z.string().url(),
  api_key: z.string().optional(),
  allowed_ips: z.string().optional(), // Comma-separated IP addresses
  require_api_key: z.boolean().optional().default(false),
  require_ip_whitelist: z.boolean().optional().default(false),
});

const webhookParamsSchema = z.object({
  id: z.coerce.number(),
});

const webhookIdParamsSchema = z.object({
  webhook_id: z.coerce.number(),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});


export async function webhookRoutes(fastify: FastifyInstance) {
  // Create webhook
  fastify.post<{ Body: WebhookCreateRequest; Reply: WebhookResponse }>(
    '/webhooks',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request, reply) => {
      const body = createWebhookSchema.parse(request.body);
      const user = request.user! as User;
      
      try {
        const stmt = fastify.db.prepare(`
          INSERT INTO webhooks (name, description, target_url, api_key, allowed_ips, require_api_key, require_ip_whitelist)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          body.name, 
          body.description, 
          body.target_url,
          body.api_key || null,
          body.allowed_ips || null,
          body.require_api_key ? 1 : 0,
          body.require_ip_whitelist ? 1 : 0
        );
        const webhookId = result.lastInsertRowid as number;
        
        // Log activity
        fastify.activityTracker.logActivity({
          userId: user.id,
          activityType: 'webhook_created',
          description: `Created webhook: ${body.name}`,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: { webhookId, webhookName: body.name },
        });
        
        const proxyUrl = `${process.env.PUBLIC_URL}/hook/${webhookId}`;
        
        return { id: webhookId, proxy_url: proxyUrl };
      } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return reply.conflict('Source URL already exists');
        }
        throw error;
      }
    }
  );

  // List all webhooks with pagination
  fastify.get<{ 
    Querystring: { page?: number; limit?: number }; 
    Reply: { webhooks: Webhook[]; total: number; page: number; limit: number; totalPages: number } 
  }>('/webhooks', {
    preHandler: [authenticateUser, requirePasswordChange],
  }, async (request) => {
    const { page, limit } = paginationQuerySchema.parse(request.query);
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = fastify.db
      .prepare('SELECT COUNT(*) as count FROM webhooks')
      .get() as { count: number };
    const total = countResult.count;
    
    // Get paginated webhooks
    const webhooks = fastify.db
      .prepare('SELECT * FROM webhooks ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Webhook[];
    
    return {
      webhooks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });

  // Get webhook by ID
  fastify.get<{ Params: { id: number }; Reply: Webhook }>(
    '/webhooks/:id',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
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

  // Update webhook
  fastify.patch<{ Params: { id: number }; Body: Partial<WebhookCreateRequest> }>(
    '/webhooks/:id',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request, reply) => {
      const { id } = webhookParamsSchema.parse(request.params);
      const body = createWebhookSchema.partial().parse(request.body);
      const user = request.user! as User;
      
      // Check if webhook exists
      const existing = fastify.db
        .prepare('SELECT * FROM webhooks WHERE id = ?')
        .get(id) as Webhook | undefined;
      
      if (!existing) {
        return reply.notFound('Webhook not found');
      }
      
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      
      if (body.name !== undefined) {
        updates.push('name = ?');
        values.push(body.name);
      }
      if (body.description !== undefined) {
        updates.push('description = ?');
        values.push(body.description);
      }
      if (body.target_url !== undefined) {
        updates.push('target_url = ?');
        values.push(body.target_url);
      }
      if (body.api_key !== undefined) {
        updates.push('api_key = ?');
        values.push(body.api_key || null);
      }
      if (body.allowed_ips !== undefined) {
        updates.push('allowed_ips = ?');
        values.push(body.allowed_ips || null);
      }
      if (body.require_api_key !== undefined) {
        updates.push('require_api_key = ?');
        values.push(body.require_api_key ? 1 : 0);
      }
      if (body.require_ip_whitelist !== undefined) {
        updates.push('require_ip_whitelist = ?');
        values.push(body.require_ip_whitelist ? 1 : 0);
      }
      
      if (updates.length === 0) {
        return reply.badRequest('No fields to update');
      }
      
      values.push(id);
      
      const sql = `UPDATE webhooks SET ${updates.join(', ')} WHERE id = ?`;
      fastify.db.prepare(sql).run(...values);
      
      // Log activity
      fastify.activityTracker.logActivity({
        userId: user.id,
        activityType: 'webhook_updated',
        description: `Updated webhook: ${existing.name}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        metadata: { webhookId: id, webhookName: existing.name },
      });
      
      // Return updated webhook
      const updated = fastify.db
        .prepare('SELECT * FROM webhooks WHERE id = ?')
        .get(id) as Webhook;
      
      return updated;
    }
  );

  // Delete webhook
  fastify.delete<{ Params: { id: number } }>(
    '/webhooks/:id',
    {
      preHandler: [authenticateUser, requirePasswordChange],
    },
    async (request, reply) => {
      const { id } = webhookParamsSchema.parse(request.params);
      const user = request.user! as User;
      
      // Get webhook name before deletion
      const webhook = fastify.db
        .prepare('SELECT * FROM webhooks WHERE id = ?')
        .get(id) as Webhook | undefined;
      
      if (!webhook) {
        return reply.notFound('Webhook not found');
      }
      
      const result = fastify.db
        .prepare('DELETE FROM webhooks WHERE id = ?')
        .run(id);
      
      if (result.changes === 0) {
        return reply.notFound('Webhook not found');
      }
      
      // Log activity
      fastify.activityTracker.logActivity({
        userId: user.id,
        activityType: 'webhook_deleted',
        description: `Deleted webhook: ${webhook.name}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        metadata: { webhookId: id, webhookName: webhook.name },
      });
      
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

      // Validate API key if required
      if (webhook.require_api_key) {
        const providedApiKey = request.headers['x-api-key'] || (request.query as any)?.api_key;
        
        if (!providedApiKey || providedApiKey !== webhook.api_key) {
          fastify.log.warn({ webhook_id }, 'Unauthorized: Invalid API key');
          return reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
        }
      }

      // Validate IP whitelist if required
      if (webhook.require_ip_whitelist && webhook.allowed_ips) {
        const clientIp = request.ip;
        const allowedIps = webhook.allowed_ips.split(',').map(ip => ip.trim());
        
        if (!allowedIps.includes(clientIp)) {
          fastify.log.warn({ webhook_id, clientIp, allowedIps }, 'Forbidden: IP not in whitelist');
          return reply.code(403).send({ error: 'Forbidden: IP address not allowed' });
        }
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
        const { statusCode } = await forwardWebhook(
          fastify.db,
          webhook_id,
          webhook.target_url,
          payload, // original source payload
          transformedPayload, // transformed payload
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

