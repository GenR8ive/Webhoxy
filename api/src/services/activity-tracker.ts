import type Database from 'better-sqlite3';
import type { Activity, ActivityType } from '../db/types.js';

export interface ActivityLogData {
  userId: number;
  activityType: ActivityType;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class ActivityTracker {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Log an activity
   */
  logActivity(data: ActivityLogData): number {
    const stmt = this.db.prepare(`
      INSERT INTO activities (user_id, activity_type, description, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.userId,
      data.activityType,
      data.description,
      data.ipAddress || null,
      data.userAgent || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get activities for a specific user
   */
  getUserActivities(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Activity[] {
    const stmt = this.db.prepare(`
      SELECT * FROM activities
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(userId, limit, offset) as Activity[];
  }

  /**
   * Get all activities (admin view)
   */
  getAllActivities(limit: number = 100, offset: number = 0): Activity[] {
    const stmt = this.db.prepare(`
      SELECT a.*, u.username
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset) as Activity[];
  }

  /**
   * Get activities by type
   */
  getActivitiesByType(
    activityType: ActivityType,
    limit: number = 50,
    offset: number = 0
  ): Activity[] {
    const stmt = this.db.prepare(`
      SELECT a.*, u.username
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.activity_type = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(activityType, limit, offset) as Activity[];
  }

  /**
   * Get activity count for a user
   */
  getUserActivityCount(userId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM activities WHERE user_id = ?
    `);

    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  /**
   * Get total activity count
   */
  getTotalActivityCount(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM activities`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Delete old activities (for cleanup)
   */
  deleteOldActivities(daysToKeep: number): number {
    const stmt = this.db.prepare(`
      DELETE FROM activities
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysToKeep);
    return result.changes;
  }
}

export function createActivityTracker(db: Database.Database): ActivityTracker {
  return new ActivityTracker(db);
}

