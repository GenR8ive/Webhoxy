import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  // Server
  port: z.coerce.number().default(8080),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  databaseUrl: z.string().default('./data/webhoxy.db'),
  
  // CORS
  corsOrigin: z.string().default('*'),
  
  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  logPretty: z.coerce.boolean().default(true),
  
  // Log Retention
  logRetentionDays: z.coerce.number().min(1).max(365).default(7), // Keep logs for 7 days by default
  logCleanupIntervalHours: z.coerce.number().min(1).max(168).default(24), // Run cleanup every 24 hours
  
  // Activity Retention
  activityRetentionDays: z.coerce.number().min(1).max(365).default(90), // Keep activities for 90 days by default
  
  // Authentication
  jwtSecret: z.string().min(32).default('change-this-secret-in-production-min-32-chars-long'),
  
  // Application
  appName: z.string().default('Webhoxy'),
  appVersion: z.string().default('0.1.0'),
  
  // Public URL (for webhooks)
  publicUrl: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

const parsed = configSchema.parse({
  port: process.env.PORT,
  host: process.env.HOST,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  logLevel: process.env.LOG_LEVEL,
  logPretty: process.env.LOG_PRETTY,
  logRetentionDays: process.env.LOG_RETENTION_DAYS,
  logCleanupIntervalHours: process.env.LOG_CLEANUP_INTERVAL_HOURS,
  activityRetentionDays: process.env.ACTIVITY_RETENTION_DAYS,
  jwtSecret: process.env.JWT_SECRET,
  appName: process.env.APP_NAME,
  appVersion: process.env.APP_VERSION,
  publicUrl: process.env.PUBLIC_URL,
});

export const config = {
  ...parsed,
  publicUrl: parsed.publicUrl?.replace(/\/$/, '') || `http://localhost:${parsed.port}/api`,
};
