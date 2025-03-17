/**
 * Schedule Repository
 * 
 * Manages schedule persistence
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';

// Schedule entity
export interface Schedule {
  id: string;
  name: string;
  queue: string;
  jobName: string;
  data: any;
  pattern: string; // Cron pattern
  timezone?: string;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schedule creation DTO
export interface CreateScheduleDto {
  name: string;
  queue: string;
  jobName: string;
  data: any;
  pattern: string;
  timezone?: string;
  enabled?: boolean;
}

// Schedule update DTO
export interface UpdateScheduleDto {
  name?: string;
  pattern?: string;
  timezone?: string;
  data?: any;
  enabled?: boolean;
}

/**
 * Repository for schedule management
 */
export class ScheduleRepository {
  private schedulesKey = 'schedules';
  
  constructor(private db: Pool) {}
  
  /**
   * Find a schedule by ID
   * 
   * @param id Schedule ID
   * @returns The schedule or null if not found
   */
  async findById(id: string): Promise<Schedule | null> {
    try {
      const result = await this.db.query(
        `SELECT * FROM schedules WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToSchedule(result.rows[0]);
    } catch (error) {
      logger.error('Error finding schedule by ID', { id, error });
      throw error;
    }
  }
  
  /**
   * Find all schedules
   * 
   * @returns List of all schedules
   */
  async findAll(): Promise<Schedule[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM schedules ORDER BY created_at DESC`
      );
      
      return result.rows.map(row => this.mapRowToSchedule(row));
    } catch (error) {
      logger.error('Error finding all schedules', { error });
      throw error;
    }
  }
  
  /**
   * Find all enabled schedules
   * 
   * @returns List of enabled schedules
   */
  async findEnabled(): Promise<Schedule[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM schedules WHERE enabled = true ORDER BY created_at DESC`
      );
      
      return result.rows.map(row => this.mapRowToSchedule(row));
    } catch (error) {
      logger.error('Error finding enabled schedules', { error });
      throw error;
    }
  }
  
  /**
   * Find schedules that are due to run
   * 
   * @returns List of due schedules
   */
  async findDue(): Promise<Schedule[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM schedules 
         WHERE enabled = true 
         AND next_run_at <= NOW()
         ORDER BY next_run_at ASC`
      );
      
      return result.rows.map(row => this.mapRowToSchedule(row));
    } catch (error) {
      logger.error('Error finding due schedules', { error });
      throw error;
    }
  }
  
  /**
   * Create a new schedule
   * 
   * @param schedule Schedule creation data
   * @returns The created schedule
   */
  async create(schedule: CreateScheduleDto): Promise<Schedule> {
    try {
      const now = new Date();
      
      const result = await this.db.query(
        `INSERT INTO schedules (
          name, queue, job_name, data, pattern, timezone, 
          enabled, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          schedule.name,
          schedule.queue,
          schedule.jobName,
          JSON.stringify(schedule.data),
          schedule.pattern,
          schedule.timezone || 'UTC',
          schedule.enabled !== undefined ? schedule.enabled : true,
          now,
          now
        ]
      );
      
      return this.mapRowToSchedule(result.rows[0]);
    } catch (error) {
      logger.error('Error creating schedule', { schedule, error });
      throw error;
    }
  }
  
  /**
   * Update a schedule
   * 
   * @param id Schedule ID
   * @param updates Schedule updates
   * @returns The updated schedule
   */
  async update(id: string, updates: UpdateScheduleDto): Promise<Schedule> {
    try {
      // Build the update query dynamically based on provided fields
      const updateFields = [];
      const queryParams = [id];
      let paramCounter = 2;
      
      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        queryParams.push(updates.name);
      }
      
      if (updates.pattern !== undefined) {
        updateFields.push(`pattern = $${paramCounter++}`);
        queryParams.push(updates.pattern);
      }
      
      if (updates.timezone !== undefined) {
        updateFields.push(`timezone = $${paramCounter++}`);
        queryParams.push(updates.timezone);
      }
      
      if (updates.data !== undefined) {
        updateFields.push(`data = $${paramCounter++}`);
        queryParams.push(JSON.stringify(updates.data));
      }
      
      if (updates.enabled !== undefined) {
        updateFields.push(`enabled = $${paramCounter++}`);
        queryParams.push(updates.enabled);
      }
      
      // Always update the updated_at timestamp
      updateFields.push(`updated_at = $${paramCounter++}`);
      queryParams.push(new Date());
      
      // If no fields to update, return the existing schedule
      if (updateFields.length === 1) { // Only updated_at
        return this.findById(id);
      }
      
      const query = `
        UPDATE schedules
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query(query, queryParams);
      
      if (result.rows.length === 0) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      return this.mapRowToSchedule(result.rows[0]);
    } catch (error) {
      logger.error('Error updating schedule', { id, updates, error });
      throw error;
    }
  }
  
  /**
   * Delete a schedule
   * 
   * @param id Schedule ID
   * @returns True if the schedule was deleted
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `DELETE FROM schedules WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error deleting schedule', { id, error });
      throw error;
    }
  }
  
  /**
   * Update a schedule's next run time
   * 
   * @param id Schedule ID
   * @param nextRunAt Next run time
   * @returns The updated schedule
   */
  async updateNextRunTime(id: string, nextRunAt: Date): Promise<Schedule> {
    try {
      const result = await this.db.query(
        `UPDATE schedules 
         SET next_run_at = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, nextRunAt]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      return this.mapRowToSchedule(result.rows[0]);
    } catch (error) {
      logger.error('Error updating schedule next run time', { id, nextRunAt, error });
      throw error;
    }
  }
  
  /**
   * Update a schedule's last run time
   * 
   * @param id Schedule ID
   * @param lastRunAt Last run time
   * @returns The updated schedule
   */
  async updateLastRunTime(id: string, lastRunAt: Date): Promise<Schedule> {
    try {
      const result = await this.db.query(
        `UPDATE schedules 
         SET last_run_at = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, lastRunAt]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      return this.mapRowToSchedule(result.rows[0]);
    } catch (error) {
      logger.error('Error updating schedule last run time', { id, lastRunAt, error });
      throw error;
    }
  }
  
  /**
   * Map a database row to a Schedule entity
   * 
   * @param row Database row
   * @returns Schedule entity
   */
  private mapRowToSchedule(row: any): Schedule {
    return {
      id: row.id,
      name: row.name,
      queue: row.queue,
      jobName: row.job_name,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      pattern: row.pattern,
      timezone: row.timezone,
      enabled: row.enabled,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
