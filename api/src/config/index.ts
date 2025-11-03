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
  
  // Application
  appName: z.string().default('Webhoxy'),
  appVersion: z.string().default('0.1.0'),
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse({
  port: process.env.PORT,
  host: process.env.HOST,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  logLevel: process.env.LOG_LEVEL,
  logPretty: process.env.LOG_PRETTY,
  appName: process.env.APP_NAME,
  appVersion: process.env.APP_VERSION,
});

