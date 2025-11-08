import type Database from 'better-sqlite3';
import type { ActivityTracker } from '../services/activity-tracker.js';
import type { User } from '../db/types.js';
import '@fastify/jwt';

// JWT payload type
export interface JWTPayload {
  id: number;
  username: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
    activityTracker: ActivityTracker;
    jwt: {
      sign: (payload: JWTPayload, options?: { expiresIn?: string }) => string;
      verify: (token: string) => JWTPayload;
    };
  }

  interface FastifyRequest {
    jwtVerify(): Promise<void>;
    user?: User | JWTPayload;
  }
}


