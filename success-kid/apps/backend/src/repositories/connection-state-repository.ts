/**
 * Connection State Repository
 * 
 * Handles data access for WebSocket connection states
 */
import { Pool } from 'pg';
import { 
  ConnectionState, 
  CreateConnectionStateDto,
  UpdateConnectionStateDto
} from '../models/connection-state';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository';

/**
 * Repository for WebSocket connection state data access
 */
export class ConnectionStateRepository extends BaseRepository {
  /**
   * Create connection state repository
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db);
  }

  /**
   * Save or update connection state
   * @param data Connection state data
   * @returns Saved connection state
   */
  async saveConnectionState(data: CreateConnectionStateDto): Promise<ConnectionState> {
    try {
      const now = new Date();
      const query = `
        INSERT INTO connection_states (
          connection_id, user_id, subscriptions, 
          last_event_id, last_seen, metadata,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (connection_id) 
        DO UPDATE SET 
          subscriptions = EXCLUDED.subscriptions,
          last_event_id = EXCLUDED.last_event_id,
          last_seen = EXCLUDED.last_seen,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const values = [
        data.connectionId,
        data.userId,
        JSON.stringify(data.subscriptions || []),
        data.lastEventId || null,
        now,
        data.metadata ? JSON.stringify(data.metadata) : null,
        now,
        now
      ];

      const result = await this.db.query(query, values);
      return this.mapConnectionStateFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error saving connection state', { error, connectionId: data.connectionId });
      throw error;
    }
  }

  /**
   * Update connection state
   * @param connectionId Connection ID
   * @param updates Updates to apply
   * @returns Updated connection state or null if not found
   */
  async updateConnectionState(
    connectionId: string,
    updates: UpdateConnectionStateDto
  ): Promise<ConnectionState | null> {
    try {
      const now = new Date();
      
      // Get current state first to merge with updates
      const current = await this.getConnectionState(connectionId);
      if (!current) {
        return null;
      }
      
      const query = `
        UPDATE connection_states
        SET 
          subscriptions = $1,
          last_event_id = $2,
          last_seen = $3,
          metadata = $4,
          updated_at = $5
        WHERE connection_id = $6
        RETURNING *
      `;

      // Merge subscriptions if provided
      const subscriptions = updates.subscriptions !== undefined
        ? updates.subscriptions
        : current.subscriptions;
        
      // Update last event ID if provided
      const lastEventId = updates.lastEventId !== undefined
        ? updates.lastEventId
        : current.lastEventId;
        
      // Merge metadata if provided
      const metadata = updates.metadata !== undefined
        ? { ...current.metadata, ...updates.metadata }
        : current.metadata;

      const values = [
        JSON.stringify(subscriptions),
        lastEventId,
        now,
        metadata ? JSON.stringify(metadata) : null,
        now,
        connectionId
      ];

      const result = await this.db.query(query, values);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return this.mapConnectionStateFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error updating connection state', { error, connectionId });
      throw error;
    }
  }

  /**
   * Get connection state by ID
   * @param connectionId Connection ID
   * @returns Connection state or null if not found
   */
  async getConnectionState(connectionId: string): Promise<ConnectionState | null> {
    try {
      const query = `
        SELECT *
        FROM connection_states
        WHERE connection_id = $1
      `;

      const result = await this.db.query(query, [connectionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapConnectionStateFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting connection state', { error, connectionId });
      throw error;
    }
  }

  /**
   * Get all connection states for a user
   * @param userId User ID
   * @returns Array of connection states
   */
  async getUserConnectionStates(userId: string): Promise<ConnectionState[]> {
    try {
      const query = `
        SELECT *
        FROM connection_states
        WHERE user_id = $1
        ORDER BY last_seen DESC
      `;

      const result = await this.db.query(query, [userId]);
      return result.rows.map(row => this.mapConnectionStateFromDb(row));
    } catch (error) {
      logger.error('Error getting user connection states', { error, userId });
      throw error;
    }
  }

  /**
   * Delete connection state
   * @param connectionId Connection ID
   * @returns True if deleted, false if not found
   */
  async deleteConnectionState(connectionId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM connection_states
        WHERE connection_id = $1
        RETURNING connection_id
      `;

      const result = await this.db.query(query, [connectionId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting connection state', { error, connectionId });
      throw error;
    }
  }

  /**
   * Delete stale connection states
   * @param olderThan Date threshold
   * @returns Number of connection states deleted
   */
  async deleteStaleConnectionStates(olderThan: Date): Promise<number> {
    try {
      const query = `
        DELETE FROM connection_states
        WHERE last_seen < $1
        RETURNING connection_id
      `;

      const result = await this.db.query(query, [olderThan]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting stale connection states', { error, olderThan });
      throw error;
    }
  }

  /**
   * Map connection state from database to model
   * @param row Database row
   * @returns ConnectionState model
   */
  private mapConnectionStateFromDb(row: any): ConnectionState {
    return {
      connectionId: row.connection_id,
      userId: row.user_id,
      subscriptions: row.subscriptions || [],
      lastEventId: row.last_event_id,
      lastSeen: row.last_seen,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
