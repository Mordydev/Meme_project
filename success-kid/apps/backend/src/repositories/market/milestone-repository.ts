/**
 * Repository for market milestones
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';
import { Milestone } from '../../features/market/types';

/**
 * Milestone repository interface
 */
export interface IMilestoneRepository {
  getMilestones(): Promise<Milestone[]>;
  getMilestoneById(id: string): Promise<Milestone | null>;
  findPendingMilestones(): Promise<Milestone[]>;
  markAchieved(id: string, achievedAt: Date): Promise<Milestone>;
  createMilestone(milestone: Omit<Milestone, 'id'>): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone>;
  deleteMilestone(id: string): Promise<boolean>;
}

/**
 * Milestone repository implementation
 */
export class MilestoneRepository implements IMilestoneRepository {
  /**
   * Create a new milestone repository
   * @param db Database connection pool
   */
  constructor(private db: Pool) {}
  
  /**
   * Get all milestones
   * @returns Array of milestones
   */
  async getMilestones(): Promise<Milestone[]> {
    try {
      const result = await this.db.query<Milestone>(
        `SELECT 
           id, name, description, target_value as "targetValue", 
           type, achieved, achieved_at as "achievedAt",
           next_milestone_id as "nextMilestoneId", 
           previous_milestone_id as "previousMilestoneId"
         FROM milestones
         ORDER BY CAST(target_value AS NUMERIC) ASC`
      );
      
      return result.rows.map(this.mapMilestoneFromDb);
    } catch (error) {
      logger.error('Failed to get milestones', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get milestone by ID
   * @param id Milestone ID
   * @returns Milestone or null if not found
   */
  async getMilestoneById(id: string): Promise<Milestone | null> {
    try {
      const result = await this.db.query<Milestone>(
        `SELECT 
           id, name, description, target_value as "targetValue", 
           type, achieved, achieved_at as "achievedAt",
           next_milestone_id as "nextMilestoneId", 
           previous_milestone_id as "previousMilestoneId"
         FROM milestones
         WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapMilestoneFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get milestone by ID', { id, error: error.message });
      throw error;
    }
  }
  
  /**
   * Find pending (unachieved) milestones
   * @returns Array of pending milestones
   */
  async findPendingMilestones(): Promise<Milestone[]> {
    try {
      const result = await this.db.query<Milestone>(
        `SELECT 
           id, name, description, target_value as "targetValue", 
           type, achieved, achieved_at as "achievedAt",
           next_milestone_id as "nextMilestoneId", 
           previous_milestone_id as "previousMilestoneId"
         FROM milestones
         WHERE achieved = false
         ORDER BY CAST(target_value AS NUMERIC) ASC`
      );
      
      return result.rows.map(this.mapMilestoneFromDb);
    } catch (error) {
      logger.error('Failed to find pending milestones', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Mark a milestone as achieved
   * @param id Milestone ID
   * @param achievedAt Achievement date
   * @returns Updated milestone
   */
  async markAchieved(id: string, achievedAt: Date): Promise<Milestone> {
    try {
      const result = await this.db.query<Milestone>(
        `UPDATE milestones
         SET achieved = true, achieved_at = $2
         WHERE id = $1
         RETURNING 
           id, name, description, target_value as "targetValue", 
           type, achieved, achieved_at as "achievedAt",
           next_milestone_id as "nextMilestoneId", 
           previous_milestone_id as "previousMilestoneId"`,
        [id, achievedAt]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Milestone not found: ${id}`);
      }
      
      return this.mapMilestoneFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Failed to mark milestone as achieved', { 
        id, 
        achievedAt, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Create a new milestone
   * @param milestone Milestone data
   * @returns Created milestone
   */
  async createMilestone(milestone: Omit<Milestone, 'id'>): Promise<Milestone> {
    try {
      const result = await this.db.query<Milestone>(
        `INSERT INTO milestones (
           name, description, target_value, type, achieved,
           achieved_at, next_milestone_id, previous_milestone_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING 
           id, name, description, target_value as "targetValue", 
           type, achieved, achieved_at as "achievedAt",
           next_milestone_id as "nextMilestoneId", 
           previous_milestone_id as "previousMilestoneId"`,
        [
          milestone.name,
          milestone.description,
          milestone.targetValue,
          milestone.type,
          milestone.achieved || false,
          milestone.achievedAt || null,
          milestone.nextMilestoneId || null,
          milestone.previousMilestoneId || null
        ]
      );
      
      return this.mapMilestoneFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create milestone', { 
        milestone, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Update a milestone
   * @param id Milestone ID
   * @param milestone Updated milestone data
   * @returns Updated milestone
   */
  async updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone> {
    try {
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      
      let paramIndex = 1;
      
      if (milestone.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(milestone.name);
      }
      
      if (milestone.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(milestone.description);
      }
      
      if (milestone.targetValue !== undefined) {
        updates.push(`target_value = $${paramIndex++}`);
        values.push(milestone.targetValue);
      }
      
      if (milestone.type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(milestone.type);
      }
      
      if (milestone.achieved !== undefined) {
        updates.push(`achieved = $${paramIndex++}`);
        values.push(milestone.achieved);
      }
      
      if (milestone.achievedAt !== undefined) {
        updates.push(`achieved_at = $${paramIndex++}`);
        values.push(milestone.achievedAt);
      }
      
      if (milestone.nextMilestoneId !== undefined) {
        updates.push(`next_milestone_id = $${paramIndex++}`);
        values.push(milestone.nextMilestoneId);
      }
      
      if (milestone.previousMilestoneId !== undefined) {
        updates.push(`previous_milestone_id = $${paramIndex++}`);
        values.push(milestone.previousMilestoneId);
      }
      
      if (updates.length === 0) {
        // No fields to update
        const existingMilestone = await this.getMilestoneById(id);
        if (!existingMilestone) {
          throw new Error(`Milestone not found: ${id}`);
        }
        
        return existingMilestone;
      }
      
      // Add ID parameter
      values.push(id);
      
      const query = `
        UPDATE milestones
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id, name, description, target_value as "targetValue", 
          type, achieved, achieved_at as "achievedAt",
          next_milestone_id as "nextMilestoneId", 
          previous_milestone_id as "previousMilestoneId"
      `;
      
      const result = await this.db.query<Milestone>(query, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Milestone not found: ${id}`);
      }
      
      return this.mapMilestoneFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update milestone', { 
        id, 
        milestone, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Delete a milestone
   * @param id Milestone ID
   * @returns True if deleted, false if not found
   */
  async deleteMilestone(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `DELETE FROM milestones
         WHERE id = $1
         RETURNING id`,
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to delete milestone', { id, error: error.message });
      throw error;
    }
  }
  
  /**
   * Map milestone from database format to application format
   * @param milestone Milestone from database
   * @returns Formatted milestone
   */
  private mapMilestoneFromDb(milestone: any): Milestone {
    return {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      targetValue: milestone.targetValue,
      type: milestone.type,
      achieved: milestone.achieved,
      achievedAt: milestone.achievedAt ? new Date(milestone.achievedAt) : undefined,
      nextMilestoneId: milestone.nextMilestoneId,
      previousMilestoneId: milestone.previousMilestoneId
    };
  }
}
