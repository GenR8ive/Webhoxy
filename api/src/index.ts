import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import jwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import { config } from './config/index.js';
import { initDatabase } from './db/index.js'; 
import { webhookRoutes } from './routes/webhooks.js';
import { mappingRoutes } from './routes/mappings.js';
import { logRoutes } from './routes/logs.js';
import { fieldRoutes } from './routes/fields.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { activityRoutes } from './routes/activities.js';
import { createLogCleanupService } from './services/log-cleanup.js';
import { createActivityTracker } from './services/activity-tracker.js';

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
await fastify.register(jwt, {
  secret: config.jwtSecret,
});

// Initialize database
const db = await initDatabase(config.databaseUrl);
fastify.decorate('db', db);

// Initialize activity tracker
const activityTracker = createActivityTracker(db);
fastify.decorate('activityTracker', activityTracker);

// Create default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  fastify.log.info('No users found. Creating default admin user...');
  const defaultPassword = 'admin';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, must_change_password, is_active)
    VALUES (?, ?, 1, 1)
  `).run('admin', passwordHash);
  
  const adminId = result.lastInsertRowid as number;
  
  // Log the user creation activity
  activityTracker.logActivity({
    userId: adminId,
    activityType: 'user_created',
    description: 'Default admin user created',
  });
  
  fastify.log.info('✓ Default admin user created (username: admin, password: admin)');
  fastify.log.warn('⚠️  IMPORTANT: Please change the admin password immediately after first login!');
}

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
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(activityRoutes, { prefix: '/api' });
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

