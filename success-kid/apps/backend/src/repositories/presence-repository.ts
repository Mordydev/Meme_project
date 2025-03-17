/**
 * Presence Repository
 * 
 * Handles data access for user presence
 */
import { Pool } from 'pg';
import { 
  PresenceData, 
  PresenceStatus,
  PresencePreferences,
  PresenceVisibility,
  UpdatePresenceDto,
  UpdatePresencePreferencesDto
} from '../models/presence';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository';

/**
 * Default presence preferences
 */
const DEFAULT_PRESENCE_PREFERENCES = {
  visibility: PresenceVisibility.EVERYONE,
  showStatus: true,
  showLastActive: true
};

/**
 * Repository for user presence data access
 */
export class PresenceRepository extends BaseRepository {
  /**
   * Create presence repository
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db);
  }

  /**
   * Update user presence
   * @param userId User ID
   * @param data Presence data update
   * @returns Updated presence data
   */
  async updatePresence(userId: string, data: UpdatePresenceDto): Promise<PresenceData> {
    try {
      const now = new Date();
      const query = `
        INSERT INTO user_presence (
          user_id, status, last_active, metadata, updated_at
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          last_active = EXCLUDED.last_active,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const values = [
        userId,
        data.status,
        now,
        data.metadata ? JSON.stringify(data.metadata) : null,
        now
      ];

      const result = await this.db.query(query, values);
      return this.mapPresenceFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error updating user presence', { error, userId, data });
      throw error;
    }
  }

  /**
   * Get user presence
   * @param userId User ID
   * @returns Presence data or null if not found
   */
  async getUserPresence(userId: string): Promise<PresenceData | null> {
    try {
      const query = `
        SELECT *
        FROM user_presence
        WHERE user_id = $1
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapPresenceFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting user presence', { error, userId });
      throw error;
    }
  }

  /**
   * Get presence for multiple users
   * @param userIds User IDs
   * @returns Map of user IDs to presence data
   */
  async getUsersPresence(userIds: string[]): Promise<Record<string, PresenceData>> {
    try {
      if (userIds.length === 0) {
        return {};
      }

      const query = `
        SELECT *
        FROM user_presence
        WHERE user_id = ANY($1)
      `;

      const result = await this.db.query(query, [userIds]);
      
      const presenceMap: Record<string, PresenceData> = {};
      result.rows.forEach(row => {
        const presence = this.mapPresenceFromDb(row);
        presenceMap[presence.userId] = presence;
      });

      return presenceMap;
    } catch (error) {
      logger.error('Error getting users presence', { error, userIds });
      throw error;
    }
  }

  /**
   * Get users with specific status
   * @param status Presence status
   * @param limit Maximum number of users to return
   * @returns Array of presence data
   */
  async getUsersByStatus(status: PresenceStatus, limit = 100): Promise<PresenceData[]> {
    try {
      const query = `
        SELECT *
        FROM user_presence
        WHERE status = $1
        ORDER BY last_active DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [status, limit]);
      return result.rows.map(row => this.mapPresenceFromDb(row));
    } catch (error) {
      logger.error('Error getting users by status', { error, status, limit });
      throw error;
    }
  }

  /**
   * Delete stale presence data
   * @param olderThan Date threshold
   * @returns Number of records deleted
   */
  async deleteStalePresence(olderThan: Date): Promise<number> {
    try {
      const query = `
        UPDATE user_presence
        SET status = $1
        WHERE updated_at < $2 AND status <> $1
        RETURNING user_id
      `;

      const result = await this.db.query(query, [PresenceStatus.OFFLINE, olderThan]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting stale presence data', { error, olderThan });
      throw error;
    }
  }

  /**
   * Get presence preferences
   * @param userId User ID
   * @returns Presence preferences
   */
  async getPresencePreferences(userId: string): Promise<PresencePreferences> {
    try {
      const query = `
        SELECT *
        FROM presence_preferences
        WHERE user_id = $1
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        // Create default preferences if none exist
        return await this.createDefaultPresencePreferences(userId);
      }

      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting presence preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Create default presence preferences
   * @param userId User ID
   * @returns Created preferences
   */
  async createDefaultPresencePreferences(userId: string): Promise<PresencePreferences> {
    try {
      const now = new Date();
      
      // Check if the table exists first (it might not be created in all environments yet)
      const tableExists = await this.checkIfTableExists('presence_preferences');
      
      if (!tableExists) {
        // Return default preferences object without storing in DB
        return {
          userId,
          visibility: DEFAULT_PRESENCE_PREFERENCES.visibility,
          showStatus: DEFAULT_PRESENCE_PREFERENCES.showStatus,
          showLastActive: DEFAULT_PRESENCE_PREFERENCES.showLastActive,
          updatedAt: now
        };
      }
      
      const query = `
        INSERT INTO presence_preferences (
          user_id, visibility, show_status, show_last_active, updated_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        userId,
        DEFAULT_PRESENCE_PREFERENCES.visibility,
        DEFAULT_PRESENCE_PREFERENCES.showStatus,
        DEFAULT_PRESENCE_PREFERENCES.showLastActive,
        now
      ];

      const result = await this.db.query(query, values);
      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error creating default presence preferences', { error, userId });
      
      // Return defaults even if DB operation fails
      return {
        userId,
        visibility: DEFAULT_PRESENCE_PREFERENCES.visibility,
        showStatus: DEFAULT_PRESENCE_PREFERENCES.showStatus,
        showLastActive: DEFAULT_PRESENCE_PREFERENCES.showLastActive,
        updatedAt: new Date()
      };
    }
  }

  /**
   * Update presence preferences
   * @param userId User ID
   * @param updates Preference updates
   * @returns Updated preferences
   */
  async updatePresencePreferences(
    userId: string,
    updates: UpdatePresencePreferencesDto
  ): Promise<PresencePreferences> {
    try {
      // Check if table exists
      const tableExists = await this.checkIfTableExists('presence_preferences');
      
      if (!tableExists) {
        // Return updated default preferences without storing
        return {
          userId,
          visibility: updates.visibility || DEFAULT_PRESENCE_PREFERENCES.visibility,
          showStatus: updates.showStatus !== undefined ? 
            updates.showStatus : DEFAULT_PRESENCE_PREFERENCES.showStatus,
          showLastActive: updates.showLastActive !== undefined ?
            updates.showLastActive : DEFAULT_PRESENCE_PREFERENCES.showLastActive,
          updatedAt: new Date()
        };
      }
      
      // Get current preferences
      const current = await this.getPresencePreferences(userId);
      const now = new Date();

      const query = `
        UPDATE presence_preferences
        SET 
          visibility = $1,
          show_status = $2,
          show_last_active = $3,
          updated_at = $4
        WHERE user_id = $5
        RETURNING *
      `;

      const values = [
        updates.visibility || current.visibility,
        updates.showStatus !== undefined ? updates.showStatus : current.showStatus,
        updates.showLastActive !== undefined ? updates.showLastActive : current.showLastActive,
        now,
        userId
      ];

      const result = await this.db.query(query, values);
      
      if (result.rowCount === 0) {
        // Create default if update failed (shouldn't happen normally)
        return await this.createDefaultPresencePreferences(userId);
      }

      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error updating presence preferences', { error, userId, updates });
      throw error;
    }
  }

  /**
   * Check if a table exists in the database
   * @param tableName Table name to check
   * @returns Whether the table exists
   */
  private async checkIfTableExists(tableName: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;

      const result = await this.db.query(query, [tableName]);
      return result.rows[0].exists;
    } catch (error) {
      logger.error('Error checking if table exists', { error, tableName });
      return false;
    }
  }

  /**
   * Map presence data from database to model
   * @param row Database row
   * @returns PresenceData model
   */
  private mapPresenceFromDb(row: any): PresenceData {
    return {
      userId: row.user_id,
      status: row.status as PresenceStatus,
      lastActive: row.last_active,
      metadata: row.metadata,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map presence preferences from database to model
   * @param row Database row
   * @returns PresencePreferences model
   */
  private mapPreferencesFromDb(row: any): PresencePreferences {
    return {
      userId: row.user_id,
      visibility: row.visibility as PresenceVisibility,
      showStatus: row.show_status,
      showLastActive: row.show_last_active,
      updatedAt: row.updated_at
    };
  }
}
