/**
 * Challenge Repository
 * 
 * Repository for managing challenge definitions, user challenge participation, and progress tracking.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';
import {
  Challenge,
  UserChallenge,
  UserChallengeProgress,
  ChallengeFilter,
  ChallengeRequirement,
  ChallengeReward,
  ChallengeStatus,
  ChallengeCompletion
} from '../../models/entities/achievement/challenge.model';

/**
 * Challenge repository implementation
 */
export class ChallengeRepository extends BaseRepository<Challenge> {
  /**
   * Create a new ChallengeRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'challenges');
  }

  /**
   * Find active challenges
   * 
   * @param includeUpcoming Whether to include upcoming challenges
   * @returns Array of active (and optionally upcoming) challenges
   */
  async findActiveChallenges(includeUpcoming: boolean = false): Promise<Challenge[]> {
    try {
      const now = new Date();
      let query = `
        SELECT * FROM challenges 
        WHERE end_date > $1 
      `;
      
      const params = [now];
      
      if (!includeUpcoming) {
        query += ` AND start_date <= $1`;
      }
      
      query += ` ORDER BY end_date ASC`;
      
      const result = await this.db.query<Challenge>(query, params);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find active challenges', { includeUpcoming, error });
      throw new DatabaseError('Failed to find active challenges', error);
    }
  }

  /**
   * Find challenges by filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of challenges matching the filter
   */
  async findByFilter(filter: ChallengeFilter): Promise<Challenge[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (filter.category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(filter.category);
      }
      
      if (filter.difficulty) {
        conditions.push(`difficulty = $${paramIndex++}`);
        values.push(filter.difficulty);
      }
      
      if (filter.status) {
        const now = new Date();
        
        if (filter.status === 'active') {
          conditions.push(`(start_date <= $${paramIndex} AND end_date > $${paramIndex})`);
          values.push(now);
          paramIndex++;
        } else if (filter.status === 'upcoming') {
          conditions.push(`start_date > $${paramIndex}`);
          values.push(now);
          paramIndex++;
        } else if (filter.status === 'completed') {
          conditions.push(`end_date <= $${paramIndex}`);
          values.push(now);
          paramIndex++;
        } else if (filter.status === 'expired') {
          conditions.push(`end_date <= $${paramIndex} AND status = 'expired'`);
          values.push(now);
          paramIndex++;
        }
      }
      
      if (filter.search) {
        conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        values.push(`%${filter.search}%`);
        paramIndex++;
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const query = `
        SELECT * FROM challenges
        ${whereClause}
        ORDER BY start_date DESC, end_date ASC, difficulty
      `;
      
      const result = await this.db.query<Challenge>(query, values);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find challenges by filter', { filter, error });
      throw new DatabaseError('Failed to find challenges by filter', error);
    }
  }

  /**
   * Create a new challenge
   * 
   * @param data Challenge data
   * @returns Created challenge
   */
  async createChallenge(
    data: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Challenge> {
    try {
      const id = uuidv4();
      
      const result = await this.db.query<Challenge>(
        `INSERT INTO challenges(
          id, title, description, image_url, category, difficulty, 
          start_date, end_date, requirements, rewards, status, 
          created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.title,
          data.description,
          data.image_url,
          data.category,
          data.difficulty,
          data.start_date,
          data.end_date,
          JSON.stringify(data.requirements),
          JSON.stringify(data.rewards),
          data.status
        ]
      );
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create challenge', { data, error });
      throw new DatabaseError('Failed to create challenge', error);
    }
  }

  /**
   * Get user's challenges
   * 
   * @param userId User ID
   * @param status Optional status filter
   * @returns Array of user challenges with challenge info
   */
  async getUserChallenges(
    userId: string,
    status?: 'active' | 'completed' | 'all'
  ): Promise<any[]> {
    try {
      let query = `
        SELECT uc.*, c.*, 
               CASE WHEN c.end_date <= NOW() AND uc.completed_at IS NULL THEN 'expired'
                    ELSE uc.status 
               END AS effective_status
        FROM user_challenges uc
        JOIN challenges c ON uc.challenge_id = c.id
        WHERE uc.user_id = $1
      `;
      
      const params: any[] = [userId];
      
      if (status === 'active') {
        query += ` AND uc.status = 'active' AND c.end_date > NOW()`;
      } else if (status === 'completed') {
        query += ` AND uc.completed_at IS NOT NULL`;
      }
      
      query += ` ORDER BY uc.joined_at DESC`;
      
      const result = await this.db.query(query, params);
      
      // Get progress for each challenge
      const challenges = await Promise.all(result.rows.map(async (row) => {
        const progress = await this.getUserChallengeProgress(userId, row.id);
        
        return {
          userChallenge: {
            user_id: row.user_id,
            challenge_id: row.challenge_id,
            joined_at: row.joined_at,
            completed_at: row.completed_at,
            status: row.effective_status, // Use effective status
            updated_at: row.updated_at
          },
          challenge: {
            id: row.id,
            title: row.title,
            description: row.description,
            image_url: row.image_url,
            category: row.category,
            difficulty: row.difficulty,
            start_date: row.start_date,
            end_date: row.end_date,
            requirements: typeof row.requirements === 'string' 
              ? JSON.parse(row.requirements) 
              : row.requirements,
            rewards: typeof row.rewards === 'string' 
              ? JSON.parse(row.rewards) 
              : row.rewards,
            status: row.status
          },
          progress: progress
        };
      }));
      
      return challenges;
    } catch (error) {
      logger.error('Failed to get user challenges', { userId, status, error });
      throw new DatabaseError('Failed to get user challenges', error);
    }
  }

  /**
   * Join a challenge
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Created user challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    return this.withTransaction(async (client) => {
      try {
        // Check if challenge exists and is active
        const challengeResult = await client.query<Challenge>(
          `SELECT * FROM challenges 
           WHERE id = $1 AND start_date <= NOW() AND end_date > NOW()`,
          [challengeId]
        );
        
        if (challengeResult.rows.length === 0) {
          throw new Error(`Challenge with ID ${challengeId} not found or not active`);
        }
        
        // Check if user has already joined
        const existingResult = await client.query<UserChallenge>(
          'SELECT * FROM user_challenges WHERE user_id = $1 AND challenge_id = $2',
          [userId, challengeId]
        );
        
        if (existingResult.rows.length > 0) {
          // User has already joined
          return existingResult.rows[0];
        }
        
        // Join the challenge
        const result = await client.query<UserChallenge>(
          `INSERT INTO user_challenges(
            user_id, challenge_id, joined_at, completed_at, status, updated_at
          ) VALUES($1, $2, NOW(), NULL, 'active', NOW())
          RETURNING *`,
          [userId, challengeId]
        );
        
        // Initialize progress tracking for each requirement
        const challenge = challengeResult.rows[0];
        const requirements = typeof challenge.requirements === 'string' 
          ? JSON.parse(challenge.requirements) 
          : challenge.requirements;
          
        for (const requirement of requirements) {
          await client.query(
            `INSERT INTO user_challenge_progress(
              user_id, challenge_id, requirement_id, current_value, target_value, updated_at
            ) VALUES($1, $2, $3, 0, $4, NOW())`,
            [userId, challengeId, requirement.id, requirement.target_value]
          );
        }
        
        return result.rows[0];
      } catch (error) {
        logger.error('Failed to join challenge', { userId, challengeId, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Get user's progress for a challenge
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Array of progress items for each requirement
   */
  async getUserChallengeProgress(
    userId: string,
    challengeId: string
  ): Promise<UserChallengeProgress[]> {
    try {
      const result = await this.db.query<UserChallengeProgress>(
        `SELECT * FROM user_challenge_progress 
         WHERE user_id = $1 AND challenge_id = $2`,
        [userId, challengeId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user challenge progress', { userId, challengeId, error });
      throw new DatabaseError('Failed to get user challenge progress', error);
    }
  }

  /**
   * Update user's progress for a challenge requirement
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @param requirementId Requirement ID
   * @param currentValue Current progress value
   * @returns Updated progress record
   */
  async updateChallengeProgress(
    userId: string,
    challengeId: string,
    requirementId: string,
    currentValue: number
  ): Promise<UserChallengeProgress> {
    try {
      // Check if progress record exists
      const existingResult = await this.db.query<UserChallengeProgress>(
        `SELECT * FROM user_challenge_progress 
         WHERE user_id = $1 AND challenge_id = $2 AND requirement_id = $3`,
        [userId, challengeId, requirementId]
      );
      
      if (existingResult.rows.length === 0) {
        // Progress record doesn't exist, get challenge to determine target value
        const challengeResult = await this.db.query<Challenge>(
          'SELECT * FROM challenges WHERE id = $1',
          [challengeId]
        );
        
        if (challengeResult.rows.length === 0) {
          throw new Error(`Challenge with ID ${challengeId} not found`);
        }
        
        const challenge = this.mapToEntity(challengeResult.rows[0]);
        const requirement = challenge.requirements.find(r => r.id === requirementId);
        
        if (!requirement) {
          throw new Error(`Requirement with ID ${requirementId} not found in challenge`);
        }
        
        // Create progress record
        const result = await this.db.query<UserChallengeProgress>(
          `INSERT INTO user_challenge_progress(
            user_id, challenge_id, requirement_id, current_value, target_value, updated_at
          ) VALUES($1, $2, $3, $4, $5, NOW())
          RETURNING *`,
          [userId, challengeId, requirementId, currentValue, requirement.target_value]
        );
        
        return result.rows[0];
      } else {
        // Update existing record, but never decrease progress
        const existingProgress = existingResult.rows[0];
        const newValue = Math.max(existingProgress.current_value, currentValue);
        
        const result = await this.db.query<UserChallengeProgress>(
          `UPDATE user_challenge_progress 
           SET current_value = $4, updated_at = NOW() 
           WHERE user_id = $1 AND challenge_id = $2 AND requirement_id = $3
           RETURNING *`,
          [userId, challengeId, requirementId, newValue]
        );
        
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Failed to update challenge progress', { 
        userId, challengeId, requirementId, currentValue, error 
      });
      throw new DatabaseError('Failed to update challenge progress', error);
    }
  }

  /**
   * Check if a user has completed all requirements for a challenge
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns True if all requirements are completed
   */
  async isChallengeCompleted(userId: string, challengeId: string): Promise<boolean> {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM user_challenge_progress 
           WHERE user_id = $1 AND challenge_id = $2 AND current_value >= target_value) as completed,
          (SELECT COUNT(*) FROM user_challenge_progress 
           WHERE user_id = $1 AND challenge_id = $2) as total
      `;
      
      const result = await this.db.query<{ completed: string; total: string }>(
        query,
        [userId, challengeId]
      );
      
      if (result.rows.length === 0 || parseInt(result.rows[0].total, 10) === 0) {
        return false;
      }
      
      return parseInt(result.rows[0].completed, 10) === parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Failed to check if challenge is completed', { userId, challengeId, error });
      throw new DatabaseError('Failed to check if challenge is completed', error);
    }
  }

  /**
   * Complete a challenge for a user
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Challenge completion data
   */
  async completeChallenge(userId: string, challengeId: string): Promise<ChallengeCompletion> {
    return this.withTransaction(async (client) => {
      try {
        // Check if user has joined the challenge
        const userChallengeResult = await client.query<UserChallenge>(
          'SELECT * FROM user_challenges WHERE user_id = $1 AND challenge_id = $2',
          [userId, challengeId]
        );
        
        if (userChallengeResult.rows.length === 0) {
          throw new Error(`User ${userId} has not joined challenge ${challengeId}`);
        }
        
        // Check if already completed
        if (userChallengeResult.rows[0].completed_at) {
          // Already completed, return completion data
          const challengeResult = await client.query<Challenge>(
            'SELECT * FROM challenges WHERE id = $1',
            [challengeId]
          );
          
          const challenge = this.mapToEntity(challengeResult.rows[0]);
          
          return {
            challengeId,
            userId,
            completedAt: userChallengeResult.rows[0].completed_at,
            rewards: challenge.rewards
          };
        }
        
        // Verify completion
        const isCompleted = await this.isChallengeCompleted(userId, challengeId);
        if (!isCompleted) {
          throw new Error(`Challenge ${challengeId} is not completed by user ${userId}`);
        }
        
        // Get challenge for rewards
        const challengeResult = await client.query<Challenge>(
          'SELECT * FROM challenges WHERE id = $1',
          [challengeId]
        );
        
        if (challengeResult.rows.length === 0) {
          throw new Error(`Challenge with ID ${challengeId} not found`);
        }
        
        const challenge = this.mapToEntity(challengeResult.rows[0]);
        
        // Mark as completed
        const completedAt = new Date();
        await client.query(
          `UPDATE user_challenges 
           SET completed_at = $3, status = 'completed', updated_at = NOW() 
           WHERE user_id = $1 AND challenge_id = $2`,
          [userId, challengeId, completedAt]
        );
        
        // Return completion data
        return {
          challengeId,
          userId,
          completedAt,
          rewards: challenge.rewards
        };
      } catch (error) {
        logger.error('Failed to complete challenge', { userId, challengeId, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Update challenge status based on dates
   * 
   * @returns Number of challenges updated
   */
  async updateChallengeStatuses(): Promise<number> {
    try {
      const now = new Date();
      
      // Update statuses based on dates
      const result = await this.db.query(`
        UPDATE challenges
        SET status = 
          CASE 
            WHEN end_date <= $1 THEN 'completed'
            WHEN start_date <= $1 AND end_date > $1 THEN 'active'
            WHEN start_date > $1 THEN 'upcoming'
            ELSE status
          END,
        updated_at = NOW()
        WHERE (
          (end_date <= $1 AND status != 'completed') OR
          (start_date <= $1 AND end_date > $1 AND status != 'active') OR
          (start_date > $1 AND status != 'upcoming')
        )
      `, [now]);
      
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to update challenge statuses', { error });
      throw new DatabaseError('Failed to update challenge statuses', error);
    }
  }

  /**
   * Convert a database row to a challenge entity
   * 
   * @param row Database row
   * @returns Challenge entity
   */
  protected mapToEntity(row: Record<string, any>): Challenge {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      image_url: row.image_url,
      category: row.category,
      difficulty: row.difficulty,
      start_date: row.start_date,
      end_date: row.end_date,
      requirements: typeof row.requirements === 'string' 
        ? JSON.parse(row.requirements) 
        : row.requirements,
      rewards: typeof row.rewards === 'string' 
        ? JSON.parse(row.rewards) 
        : row.rewards,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
