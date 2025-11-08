import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { User, RefreshToken } from '../db/types.js';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * Login endpoint
   */
  fastify.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    
    // Get user from database
    const user = fastify.db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(body.username) as User | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'Invalid username or password',
        statusCode: 401,
      });
    }
    
    // Check if user is active
    if (user.is_active !== 1) {
      return reply.status(401).send({
        error: 'Account is inactive',
        statusCode: 401,
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, user.password_hash);
    
    if (!isPasswordValid) {
      return reply.status(401).send({
        error: 'Invalid username or password',
        statusCode: 401,
      });
    }
    
    // Generate access token (15 minutes)
    const accessToken = fastify.jwt.sign(
      { id: user.id, username: user.username },
      { expiresIn: '15m' }
    );
    
    // Generate refresh token (7 days)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Store refresh token in database
    fastify.db
      .prepare(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
      )
      .run(user.id, refreshToken, expiresAt.toISOString());
    
    // Log activity
    fastify.activityTracker.logActivity({
      userId: user.id,
      activityType: 'logged_in',
      description: `User ${user.username} logged in`,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
    
    return reply.send({
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      mustChangePassword: user.must_change_password === 1,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  });

  /**
   * Refresh token endpoint
   */
  fastify.post('/auth/refresh', async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body);
    
    // Find refresh token in database
    const tokenRecord = fastify.db
      .prepare('SELECT * FROM refresh_tokens WHERE token = ?')
      .get(body.refreshToken) as RefreshToken | undefined;
    
    if (!tokenRecord) {
      return reply.status(401).send({
        error: 'Invalid refresh token',
        statusCode: 401,
      });
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired token
      fastify.db
        .prepare('DELETE FROM refresh_tokens WHERE id = ?')
        .run(tokenRecord.id);
      
      return reply.status(401).send({
        error: 'Refresh token expired',
        statusCode: 401,
      });
    }
    
    // Get user
    const user = fastify.db
      .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
      .get(tokenRecord.user_id) as User | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'User not found or inactive',
        statusCode: 401,
      });
    }
    
    // Generate new access token
    const accessToken = fastify.jwt.sign(
      { id: user.id, username: user.username },
      { expiresIn: '15m' }
    );
    
    return reply.send({
      accessToken,
      expiresIn: 900, // 15 minutes in seconds
      mustChangePassword: user.must_change_password === 1,
    });
  });

  /**
   * Change password endpoint
   */
  fastify.post('/auth/change-password', {
    preHandler: [authenticateUser],
  }, async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    const user = request.user! as User;
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      body.currentPassword,
      user.password_hash
    );
    
    if (!isCurrentPasswordValid) {
      return reply.status(400).send({
        error: 'Current password is incorrect',
        statusCode: 400,
      });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(body.newPassword, 10);
    
    // Update password and reset must_change_password flag
    fastify.db
      .prepare(
        'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime(\'now\') WHERE id = ?'
      )
      .run(newPasswordHash, user.id);
    
    // Invalidate all refresh tokens for this user
    fastify.db
      .prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
      .run(user.id);
    
    // Log activity
    fastify.activityTracker.logActivity({
      userId: user.id,
      activityType: 'password_changed',
      description: `User ${user.username} changed their password`,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
    
    return reply.send({
      message: 'Password changed successfully',
      success: true,
    });
  });

  /**
   * Logout endpoint
   */
  fastify.post('/auth/logout', {
    preHandler: [authenticateUser],
  }, async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    const user = request.user! as User;
    
    // Delete the specific refresh token if provided
    if (body.refreshToken) {
      fastify.db
        .prepare('DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?')
        .run(body.refreshToken, user.id);
    } else {
      // Delete all refresh tokens for the user
      fastify.db
        .prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
        .run(user.id);
    }
    
    // Log activity
    fastify.activityTracker.logActivity({
      userId: user.id,
      activityType: 'logged_out',
      description: `User ${user.username} logged out`,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
    
    return reply.send({
      message: 'Logged out successfully',
      success: true,
    });
  });

  /**
   * Get current user info
   */
  fastify.get('/auth/me', {
    preHandler: [authenticateUser],
  }, async (request, reply) => {
    const user = request.user! as User;
    
    return reply.send({
      id: user.id,
      username: user.username,
      mustChangePassword: user.must_change_password === 1,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  });
}

