import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { config } from './config/';
import { initDatabase } from './db/'; 
import { webhookRoutes } from './routes/webhooks';
import { mappingRoutes } from './routes/mappings';
import { logRoutes } from './routes/logs';
import { fieldRoutes } from './routes/fields';
import { adminRoutes } from './routes/admin';
import { createLogCleanupService } from './services/log-cleanup';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport: config.logPretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
});

// Register plugins
await fastify.register(sensible);
await fastify.register(cors, {
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  credentials: true,
});

// Initialize database
const db = await initDatabase(config.databaseUrl);
fastify.decorate('db', db);

// Initialize log cleanup service
const logCleanupService = createLogCleanupService(
  db,
  config.logRetentionDays,
  config.logCleanupIntervalHours,
  fastify.log
);
fastify.decorate('logCleanup', logCleanupService);
logCleanupService.start();

// Health check route
fastify.get('/', async () => {
  return { 
    message: '🧩 Webhoxy - Webhook Proxy Service',
    version: config.appVersion,
    status: 'healthy',
    logCleanup: logCleanupService.getStats()
  };
});

// Register API routes
await fastify.register(webhookRoutes, { prefix: '/api' });
await fastify.register(mappingRoutes, { prefix: '/api' });
await fastify.register(logRoutes, { prefix: '/api' });
await fastify.register(fieldRoutes, { prefix: '/api' });
await fastify.register(adminRoutes, { prefix: '/api' });

// Error handler
fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;
  
  reply.status(statusCode).send({
    error: message,
    statusCode,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: config.port, 
      host: config.host 
    });
    
    fastify.log.info(`Server listening on ${config.host}:${config.port}`);
    fastify.log.info(`Environment: ${config.nodeEnv}`);
    fastify.log.info(`Database: ${config.databaseUrl}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server...`);
    logCleanupService.stop();
    await fastify.close();
    process.exit(0);
  });
});

