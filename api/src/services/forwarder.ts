import type { FastifyBaseLogger } from 'fastify';

interface ForwardResult {
  statusCode: number;
  responseBody: string;
}

export async function forwardWebhook(
  db: any,
  webhookId: number,
  targetUrl: string,
  sourcePayload: any,
  transformedPayload: any,
  logger: FastifyBaseLogger
): Promise<ForwardResult> {
  logger.info({ webhookId, targetUrl }, 'Forwarding webhook');
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhoxy/1.0',
      },
      body: JSON.stringify(transformedPayload),
    });
    
    const responseBody = await response.text();
    const statusCode = response.status;
    
    logger.info({ webhookId, statusCode }, 'Webhook forwarded successfully');
    logger.info( {transformedPayload: JSON.stringify(transformedPayload)} , 'Transformed Payload');
    
    // Log delivery with both source and transformed payloads
    logWebhookDelivery(
      db,
      webhookId,
      JSON.stringify(sourcePayload),
      JSON.stringify(transformedPayload),
      statusCode,
      responseBody
    );
    
    return { statusCode, responseBody };
  } catch (error: any) {
    logger.error({ error, webhookId }, 'Failed to forward webhook');
    
    // Log failure
    logWebhookDelivery(
      db,
      webhookId,
      JSON.stringify(sourcePayload),
      JSON.stringify(transformedPayload),
      0,
      `Error: ${error.message}`
    );
    
    throw new Error(`Failed to forward webhook: ${error.message}`);
  }
}

function logWebhookDelivery(
  db: any,
  webhookId: number,
  sourcePayload: string,
  transformedPayload: string,
  responseCode: number,
  responseBody: string
): void {
  try {
    db.prepare(`
      INSERT INTO logs (webhook_id, source_payload, payload, response_code, response_body)
      VALUES (?, ?, ?, ?, ?)
    `).run(webhookId, sourcePayload, transformedPayload, responseCode, responseBody);
  } catch (error: any) {
    console.error('Failed to log webhook delivery:', error);
  }
}

