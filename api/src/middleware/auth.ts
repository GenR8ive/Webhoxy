import { FastifyRequest, FastifyReply } from 'fastify';
import type Database from 'better-sqlite3';
import type { User } from '../db/types.js';

export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    
    // After jwtVerify(), request.user contains the JWT payload
    const jwtPayload = request.user as { id: number; username: string };
    
    const db = request.server.db as Database.Database;
    
    // Get user from database
    const user = db
      .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
      .get(jwtPayload.id) as User | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'User not found or inactive',
        statusCode: 401,
      });
    }
    
    // Attach full user to request (replacing JWT payload)
    request.user = user;
  } catch (err) {
    console.log(err);
    return reply.status(401).send({
      error: 'Invalid or expired token',
      statusCode: 401,
    });
  }
}

export async function requirePasswordChange(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Authentication required',
      statusCode: 401,
    });
  }
  
  // After authenticateUser, request.user is always a User
  const user = request.user as User;
  
  if (user.must_change_password === 1) {
    return reply.status(403).send({
      error: 'Password change required',
      statusCode: 403,
      must_change_password: true,
    });
  }
}

