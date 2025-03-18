/**
 * Leaderboard Repository
 * 
 * Handles data access for leaderboards
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { logger } from '../lib/logger';
import { LeaderboardCategory, LeaderboardPeriod } from '../services/leaderboards/leaderboard-service';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
  change?: number; // Change in rank compared to previous period
}

export class LeaderboardRepository {
  constructor(private db: Pool) {}
  
  /**
   * Get leaderboard data for a specific category and time period
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    limit: number = 20,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    try {
      const query = `
        SELECT 
          rank,
          user_id as "userId",
          score,
          rank_change as "change"
        FROM leaderboards
        WHERE category = $1 AND period = $2
        ORDER BY rank ASC
        LIMIT $3 OFFSET $4
      `;
      
      const result = await this.db.query(query, [category, period, limit, offset]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting leaderboard', { error, category, period, limit, offset });
      throw error;
    }
  }
  
  /**
   * Get a user's rank on a specific leaderboard
   */
  async getUserRank(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<LeaderboardEntry | null> {
    try {
      const query = `
        SELECT 
          rank,
          user_id as "userId",
          score,
          rank_change as "change"
        FROM leaderboards
        WHERE category = $1 AND period = $2 AND user_id = $3
        LIMIT 1
      `;
      
      const result = await this.db.query(query, [category, period, userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user rank', { error, userId, category, period });
      throw error;
    }
  }
  
  /**
   * Update leaderboard data
   */
  async updateLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    entries: LeaderboardEntry[]
  ): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete existing entries for this category and period
      await client.query(
        'DELETE FROM leaderboards WHERE category = $1 AND period = $2',
        [category, period]
      );
      
      // Insert new entries
      for (const entry of entries) {
        await client.query(
          `
          INSERT INTO leaderboards (
            category, period, rank, user_id, score, rank_change, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `,
          [
            category,
            period,
            entry.rank,
            entry.userId,
            entry.score,
            entry.change || 0
          ]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating leaderboard', { error, category, period });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Check if user is in top N of a leaderboard
   */
  async isUserInTopN(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    topN: number
  ): Promise<boolean> {
    try {
      const userRank = await this.getUserRank(userId, category, period);
      
      return !!userRank && userRank.rank <= topN;
    } catch (error) {
      logger.error('Error checking if user is in top N', { error, userId, category, period, topN });
      return false;
    }
  }
  
  /**
   * Get total number of entries in a leaderboard
   */
  async getLeaderboardCount(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM leaderboards
        WHERE category = $1 AND period = $2
      `;
      
      const result = await this.db.query<{ count: string }>(query, [category, period]);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting leaderboard count', { error, category, period });
      throw error;
    }
  }
}
