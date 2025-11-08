import { FastifyInstance } from 'fastify';
import { authenticateUser, requirePasswordChange } from '../middleware/auth.js';
import type { User } from '../db/types.js';
import { z } from 'zod';

const activityQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(500).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  type: z.string().optional(),
});

export async function activityRoutes(fastify: FastifyInstance) {
  /**
   * Get all activities (for the current user or all if admin)
   */
  fastify.get('/activities', {
    preHandler: [authenticateUser, requirePasswordChange],
  }, async (request, reply) => {
    const query = activityQuerySchema.parse(request.query);
    const user = request.user! as User;
    
    let activities;
    let totalCount;
    
    if (query.type) {
      // Filter by activity type
      activities = fastify.activityTracker.getActivitiesByType(
        query.type as any,
        query.limit,
        query.offset
      );
      
      // Get total count for pagination
      const countResult = fastify.db
        .prepare('SELECT COUNT(*) as count FROM activities WHERE activity_type = ?')
        .get(query.type) as { count: number };
      totalCount = countResult.count;
    } else {
      // Get user's own activities
      activities = fastify.activityTracker.getUserActivities(
        user.id,
        query.limit,
        query.offset
      );
      
      totalCount = fastify.activityTracker.getUserActivityCount(user.id);
    }
    
    return reply.send({
      activities,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: totalCount,
      },
    });
  });

  /**
   * Get all activities from all users (admin-like view)
   */
  fastify.get('/activities/all', {
    preHandler: [authenticateUser, requirePasswordChange],
  }, async (request, reply) => {
    const query = activityQuerySchema.parse(request.query);
    
    const activities = fastify.activityTracker.getAllActivities(
      query.limit,
      query.offset
    );
    
    const totalCount = fastify.activityTracker.getTotalActivityCount();
    
    return reply.send({
      activities,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: totalCount,
      },
    });
  });

  /**
   * Get activity statistics
   */
  fastify.get('/activities/stats', {
    preHandler: [authenticateUser, requirePasswordChange],
  }, async (request, reply) => {
    const user = request.user! as User;
    
    // Get activity counts by type for the user
    const activityStats = fastify.db
      .prepare(`
        SELECT activity_type, COUNT(*) as count
        FROM activities
        WHERE user_id = ?
        GROUP BY activity_type
        ORDER BY count DESC
      `)
      .all(user.id) as Array<{ activity_type: string; count: number }>;
    
    // Get recent activity count (last 24 hours)
    const recentActivityResult = fastify.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM activities
        WHERE user_id = ? AND created_at >= datetime('now', '-1 day')
      `)
      .get(user.id) as { count: number };
    
    return reply.send({
      stats: activityStats,
      recentCount: recentActivityResult.count,
      totalCount: fastify.activityTracker.getUserActivityCount(user.id),
    });
  });
}

