/**
 * Session Repository
 * 
 * Handles data access for user sessions
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Session } from '../models/session';
import { logger } from '../lib/logger';
import { db } from '../lib/db';

export class SessionRepository extends BaseRepository<Session> {
  constructor(db: Pool = db) {
    super(db, 'sessions', 'id');
  }

  /**
   * Find sessions by user ID
   */
  async findByUserId(userId: string): Promise<Session[]> {
    try {
      const query = 'SELECT * FROM sessions WHERE user_id = $1';
      const result = await this.db.query<Session>(query, [userId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error finding sessions by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Delete sessions by user ID
   */
  async deleteByUserId(userId: string): Promise<number> {
    try {
      const query = 'DELETE FROM sessions WHERE user_id = $1 RETURNING id';
      const result = await this.db.query<{ id: string }>(query, [userId]);
      
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting sessions by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired(now: Date): Promise<number> {
    try {
      const query = 'DELETE FROM sessions WHERE expires_at < $1 RETURNING id';
      const result = await this.db.query<{ id: string }>(query, [now]);
      
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting expired sessions', { error });
      throw error;
    }
  }

  /**
   * Count active sessions by user ID
   */
  async countActiveByUserId(userId: string): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1 AND expires_at > NOW()';
      const result = await this.db.query<{ count: string }>(query, [userId]);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting active sessions by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Get latest session by user ID
   */
  async getLatestByUserId(userId: string): Promise<Session | null> {
    try {
      const query = 'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1';
      const result = await this.db.query<Session>(query, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting latest session by user ID', { error, userId });
      throw error;
    }
  }
}
