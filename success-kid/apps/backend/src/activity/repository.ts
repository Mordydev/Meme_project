/**
 * Activity Repository
 * 
 * Handles database operations for activity events and feeds.
 */
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../database';
import { logger } from '../lib/logger';
import {
  ActivityEvent,
  ActivityType,
  ActivityVisibility,
  CreateActivityEventDto,
  FeedItem,
  FeedOptions
} from './models';

/**
 * Activity repository class
 */
export class ActivityRepository {
  private pool: Pool;

  /**
   * Create an activity repository instance
   */
  constructor() {
    this.pool = getDatabase().pool;
  }

  /**
   * Create a new activity event
   * 
   * @param activity Activity data
   * @returns Created activity event
   */
  async createActivity(activity: CreateActivityEventDto): Promise<ActivityEvent> {
    const query = `
      INSERT INTO activity_events (
        id, type, actor_id, target_id, object_id, data, visibility, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const id = uuid();
    const now = new Date();
    
    const values = [
      id,
      activity.type,
      activity.actorId,
      activity.targetId || null,
      activity.objectId || null,
      JSON.stringify(activity.data || {}),
      activity.visibility,
      now
    ];
    
    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToActivityEvent(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create activity event', { error, activity });
      throw new Error('Failed to create activity event');
    }
  }

  /**
   * Get an activity event by ID
   * 
   * @param id Activity event ID
   * @returns Activity event or null if not found
   */
  async getActivityById(id: string): Promise<ActivityEvent | null> {
    const query = `
      SELECT * FROM activity_events
      WHERE id = $1
    `;
    
    try {
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToActivityEvent(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get activity event', { error, id });
      throw new Error('Failed to get activity event');
    }
  }

  /**
   * Get activity events for a user
   * 
   * @param userId User ID
   * @param options Query options
   * @returns Activity events
   */
  async getActivitiesForUser(
    userId: string,
    options: { limit?: number; before?: Date; after?: Date; types?: ActivityType[] } = {}
  ): Promise<ActivityEvent[]> {
    let query = `
      SELECT * FROM activity_events
      WHERE actor_id = $1
    `;
    
    const values: any[] = [userId];
    let paramCount = 1;
    
    if (options.types && options.types.length > 0) {
      paramCount++;
      query += ` AND type = ANY($${paramCount}::text[])`;
      values.push(options.types);
    }
    
    if (options.before) {
      paramCount++;
      query += ` AND created_at < $${paramCount}`;
      values.push(options.before);
    }
    
    if (options.after) {
      paramCount++;
      query += ` AND created_at > $${paramCount}`;
      values.push(options.after);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
    values.push(options.limit || 20);
    
    try {
      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToActivityEvent(row));
    } catch (error) {
      logger.error('Failed to get activities for user', { error, userId });
      throw new Error('Failed to get activities for user');
    }
  }

  /**
   * Get feed items for a user
   * 
   * @param userId User ID
   * @param options Feed options
   * @returns Feed items
   */
  async getFeedForUser(userId: string, options: FeedOptions = {}): Promise<FeedItem[]> {
    try {
      // Get user's followed entities
      const following = await this.getUserFollowing(userId);
      
      // If not following anyone, just get their own activities
      if (following.length === 0) {
        return this.getSelfFeed(userId, options);
      }
      
      // Build query for both followed activities and own activities
      let query = `
        SELECT 
          af.id,
          af.activity_id,
          af.user_id,
          ae.type,
          ae.actor_id,
          ae.data,
          af.is_read,
          af.created_at
        FROM activity_feed af
        JOIN activity_events ae ON af.activity_id = ae.id
        WHERE af.user_id = $1
      `;
      
      const values: any[] = [userId];
      let paramCount = 1;
      
      // Apply filters
      if (options.types && options.types.length > 0) {
        paramCount++;
        query += ` AND ae.type = ANY($${paramCount}::text[])`;
        values.push(options.types);
      }
      
      if (options.actors && options.actors.length > 0) {
        paramCount++;
        query += ` AND ae.actor_id = ANY($${paramCount}::text[])`;
        values.push(options.actors);
      }
      
      if (options.before) {
        paramCount++;
        query += ` AND af.created_at < $${paramCount}`;
        values.push(options.before);
      }
      
      if (options.after) {
        paramCount++;
        query += ` AND af.created_at > $${paramCount}`;
        values.push(options.after);
      }
      
      // Order and limit
      query += ` ORDER BY af.created_at DESC LIMIT $${paramCount + 1}`;
      values.push(options.limit || 20);
      
      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToFeedItem(row));
    } catch (error) {
      logger.error('Failed to get feed for user', { error, userId });
      throw new Error('Failed to get feed for user');
    }
  }

  /**
   * Get user's own activities as feed
   * 
   * @param userId User ID
   * @param options Feed options
   * @returns Feed items
   */
  private async getSelfFeed(userId: string, options: FeedOptions = {}): Promise<FeedItem[]> {
    let query = `
      SELECT 
        id as activity_id,
        $1 as user_id,
        type,
        actor_id,
        data,
        false as is_read,
        created_at
      FROM activity_events
      WHERE actor_id = $1
    `;
    
    const values: any[] = [userId];
    let paramCount = 1;
    
    // Apply filters
    if (options.types && options.types.length > 0) {
      paramCount++;
      query += ` AND type = ANY($${paramCount}::text[])`;
      values.push(options.types);
    }
    
    if (options.before) {
      paramCount++;
      query += ` AND created_at < $${paramCount}`;
      values.push(options.before);
    }
    
    if (options.after) {
      paramCount++;
      query += ` AND created_at > $${paramCount}`;
      values.push(options.after);
    }
    
    // Order and limit
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
    values.push(options.limit || 20);
    
    try {
      const result = await this.pool.query(query, values);
      
      return result.rows.map(row => ({
        id: uuid(), // Generate a feed item ID since these aren't real feed items
        activityId: row.activity_id,
        userId: row.user_id,
        type: row.type,
        actorId: row.actor_id,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        isRead: row.is_read,
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      logger.error('Failed to get self feed', { error, userId });
      throw new Error('Failed to get feed for user');
    }
  }

  /**
   * Process an activity for user feeds
   * 
   * @param activity Activity to process
   * @returns Processing result
   */
  async processActivityForFeeds(activity: ActivityEvent): Promise<{ count: number }> {
    try {
      // Skip private activities
      if (activity.visibility === ActivityVisibility.PRIVATE) {
        return { count: 0 };
      }
      
      let targets: string[] = [];
      
      // For public activities, add to global feed
      if (activity.visibility === ActivityVisibility.PUBLIC) {
        // In a real implementation, you'd determine who to show this to
        // For now, we'll just add a placeholder
      }
      
      // For follower-only activities, add to followers' feeds
      if (activity.visibility === ActivityVisibility.FOLLOWERS) {
        const followers = await this.getUserFollowers(activity.actorId);
        targets = followers.map(f => f.sourceId);
      }
      
      // Always add to actor's own feed
      targets.push(activity.actorId);
      
      // Add specific target if one exists
      if (activity.targetId && !targets.includes(activity.targetId)) {
        targets.push(activity.targetId);
      }
      
      // Deduplicate targets
      const uniqueTargets = [...new Set(targets)];
      
      // Create feed items for all targets
      const feedItems = await this.createFeedItems(activity.id, uniqueTargets);
      
      return { count: feedItems.length };
    } catch (error) {
      logger.error('Failed to process activity for feeds', { 
        error, 
        activityId: activity.id 
      });
      throw new Error('Failed to process activity for feeds');
    }
  }

  /**
   * Create feed items for multiple users
   * 
   * @param activityId Activity ID
   * @param userIds User IDs
   * @returns Created feed items
   */
  private async createFeedItems(activityId: string, userIds: string[]): Promise<FeedItem[]> {
    if (userIds.length === 0) {
      return [];
    }
    
    // Create values for bulk insert
    const values: any[] = [];
    const placeholders: string[] = [];
    const now = new Date();
    
    userIds.forEach((userId, index) => {
      const offset = index * 4;
      values.push(uuid(), activityId, userId, now);
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    });
    
    const query = `
      INSERT INTO activity_feed (id, activity_id, user_id, created_at)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    
    try {
      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToFeedItem(row));
    } catch (error) {
      logger.error('Failed to create feed items', { 
        error, 
        activityId,
        userCount: userIds.length
      });
      throw new Error('Failed to create feed items');
    }
  }

  /**
   * Mark feed items as read
   * 
   * @param feedItemIds Feed item IDs
   * @param userId User ID for verification
   * @returns Number of items updated
   */
  async markFeedItemsAsRead(feedItemIds: string[], userId: string): Promise<number> {
    if (feedItemIds.length === 0) {
      return 0;
    }
    
    const query = `
      UPDATE activity_feed
      SET is_read = true
      WHERE id = ANY($1::uuid[]) AND user_id = $2
    `;
    
    try {
      const result = await this.pool.query(query, [feedItemIds, userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to mark feed items as read', { 
        error, 
        feedItemIds,
        userId
      });
      throw new Error('Failed to mark feed items as read');
    }
  }

  /**
   * Mark all feed items as read for a user
   * 
   * @param userId User ID
   * @returns Number of items updated
   */
  async markAllFeedItemsAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE activity_feed
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `;
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to mark all feed items as read', { error, userId });
      throw new Error('Failed to mark feed items as read');
    }
  }

  /**
   * Get user following relationships
   * 
   * @param userId User ID
   * @returns Following relationships
   */
  async getUserFollowing(userId: string): Promise<Array<{ targetId: string; type: string }>> {
    try {
      // In a real implementation, query the follows table
      // For now, return a placeholder
      return [];
    } catch (error) {
      logger.error('Failed to get user following', { error, userId });
      return [];
    }
  }

  /**
   * Get user follower relationships
   * 
   * @param userId User ID
   * @returns Follower relationships
   */
  async getUserFollowers(userId: string): Promise<Array<{ sourceId: string; type: string }>> {
    try {
      // In a real implementation, query the follows table
      // For now, return a placeholder
      return [];
    } catch (error) {
      logger.error('Failed to get user followers', { error, userId });
      return [];
    }
  }

  /**
   * Map database row to ActivityEvent object
   * 
   * @param row Database row
   * @returns ActivityEvent object
   */
  private mapRowToActivityEvent(row: any): ActivityEvent {
    return {
      id: row.id,
      type: row.type as ActivityType,
      actorId: row.actor_id,
      targetId: row.target_id,
      objectId: row.object_id,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}),
      visibility: row.visibility as ActivityVisibility,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Map database row to FeedItem object
   * 
   * @param row Database row
   * @returns FeedItem object
   */
  private mapRowToFeedItem(row: any): FeedItem {
    return {
      id: row.id,
      activityId: row.activity_id,
      userId: row.user_id,
      type: row.type as ActivityType,
      actorId: row.actor_id,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}),
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
    };
  }
}

// Export singleton instance
export const activityRepository = new ActivityRepository();
