import type { FastifyBaseLogger } from 'fastify';

interface ForwardResult {
  statusCode: number;
  responseBody: string;
}

export async function forwardWebhook(
  db: any,
  webhookId: number,
  targetUrl: string,
  payload: any,
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
      body: JSON.stringify(payload),
    });
    
    const responseBody = await response.text();
    const statusCode = response.status;
    
    logger.info({ webhookId, statusCode }, 'Webhook forwarded successfully');
    logger.info( {payload: JSON.stringify(payload)} , 'Payload');
    
    // Log delivery
    logWebhookDelivery(
      db,
      webhookId,
      JSON.stringify(payload),
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
      JSON.stringify(payload),
      0,
      `Error: ${error.message}`
    );
    
    throw new Error(`Failed to forward webhook: ${error.message}`);
  }
}

function logWebhookDelivery(
  db: any,
  webhookId: number,
  payload: string,
  responseCode: number,
  responseBody: string
): void {
  try {
    db.prepare(`
      INSERT INTO logs (webhook_id, payload, response_code, response_body)
      VALUES (?, ?, ?, ?)
    `).run(webhookId, payload, responseCode, responseBody);
  } catch (error: any) {
    console.error('Failed to log webhook delivery:', error);
  }
}

