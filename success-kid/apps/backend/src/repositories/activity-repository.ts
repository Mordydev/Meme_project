/**
 * Activity Repository
 * 
 * Handles data access for activities and user feeds
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { 
  ActivityEvent, 
  CreateActivityEventDto, 
  ActivityVisibility,
  UserFeedItem,
  FeedItem,
  FeedOptions,
  FeedResult
} from '../models/activity';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository';

/**
 * Repository for activity data access
 */
export class ActivityRepository extends BaseRepository {
  /**
   * Create activity repository
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db);
  }

  /**
   * Create a new activity event
   * @param activity Activity creation parameters
   * @param client Optional database client for transactions
   * @returns Created activity
   */
  async createActivity(
    activity: CreateActivityEventDto,
    client?: PoolClient
  ): Promise<ActivityEvent> {
    try {
      const id = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO activity_events (
          id, actor_id, object_type, object_id,
          target_type, target_id, action, data,
          visibility, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      const values = [
        id,
        activity.actorId,
        activity.objectType,
        activity.objectId,
        activity.targetType || null,
        activity.targetId || null,
        activity.action,
        activity.data ? JSON.stringify(activity.data) : null,
        activity.visibility || ActivityVisibility.PUBLIC,
        now
      ];

      const executor = client || this.db;
      const result = await executor.query(query, values);

      return this.mapActivityFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error creating activity', { error, activity });
      throw error;
    }
  }

  /**
   * Get activity by ID
   * @param id Activity ID
   * @returns Activity or null if not found
   */
  async getActivityById(id: string): Promise<ActivityEvent | null> {
    try {
      const query = `
        SELECT *
        FROM activity_events
        WHERE id = $1
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapActivityFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting activity by ID', { error, id });
      throw error;
    }
  }

  /**
   * Add activity to user's feed
   * @param userId User ID
   * @param activityId Activity ID
   * @param client Optional database client for transactions
   * @returns Created feed item
   */
  async addToUserFeed(
    userId: string,
    activityId: string,
    client?: PoolClient
  ): Promise<UserFeedItem> {
    try {
      const now = new Date();
      const query = `
        INSERT INTO user_feed_items (
          user_id, activity_id, added_at, read, hidden
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, activity_id) DO NOTHING
        RETURNING *;
      `;

      const values = [
        userId,
        activityId,
        now,
        false,
        false
      ];

      const executor = client || this.db;
      const result = await executor.query(query, values);

      // If no row was inserted (due to ON CONFLICT DO NOTHING), get the existing row
      if (result.rows.length === 0) {
        const getQuery = `
          SELECT * 
          FROM user_feed_items 
          WHERE user_id = $1 AND activity_id = $2
        `;
        const getResult = await executor.query(getQuery, [userId, activityId]);
        return this.mapFeedItemFromDb(getResult.rows[0]);
      }

      return this.mapFeedItemFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error adding activity to user feed', { error, userId, activityId });
      throw error;
    }
  }

  /**
   * Process activity for multiple feeds
   * This adds the activity to the feeds of relevant users based on visibility and relationships
   * @param activity Activity to process
   * @param targetUserIds Additional users to add to (e.g., mentioned users)
   * @param client Optional database client for transactions
   * @returns Number of feeds the activity was added to
   */
  async processActivityForFeeds(
    activity: ActivityEvent,
    targetUserIds: string[] = [],
    client?: PoolClient
  ): Promise<number> {
    // Default to using the provided client or create a new transaction
    const useClient = client || await this.db.connect();
    let feedCount = 0;

    try {
      if (!client) {
        // Only start a transaction if we created our own client
        await useClient.query('BEGIN');
      }

      // 1. Always add to the actor's own feed
      await this.addToUserFeed(activity.actorId, activity.id, useClient);
      feedCount++;

      // 2. Add to explicitly targeted users' feeds
      for (const userId of targetUserIds) {
        if (userId !== activity.actorId) { // Don't duplicate for actor
          await this.addToUserFeed(userId, activity.id, useClient);
          feedCount++;
        }
      }

      // 3. For public activities, add to followers' feeds
      if (activity.visibility === ActivityVisibility.PUBLIC || 
          activity.visibility === ActivityVisibility.FOLLOWERS) {
        // This is a simplified example - in production, you'd need a followers table
        // and a more efficient way to add activities to multiple feeds
        
        // Get followers of the actor
        const followersQuery = `
          SELECT user_id 
          FROM user_follows 
          WHERE followed_id = $1
        `;
        
        try {
          const followersResult = await useClient.query(followersQuery, [activity.actorId]);
          
          // Add to each follower's feed
          for (const row of followersResult.rows) {
            const followerId = row.user_id;
            if (!targetUserIds.includes(followerId) && followerId !== activity.actorId) {
              await this.addToUserFeed(followerId, activity.id, useClient);
              feedCount++;
            }
          }
        } catch (error) {
          // If followers table doesn't exist yet, just continue
          logger.warn('Error getting followers, possibly the table does not exist yet', { error });
        }
      }

      if (!client) {
        // Only commit if we created our own transaction
        await useClient.query('COMMIT');
      }

      return feedCount;
    } catch (error) {
      if (!client) {
        // Only rollback if we created our own transaction
        await useClient.query('ROLLBACK');
      }
      logger.error('Error processing activity for feeds', { error, activityId: activity.id });
      throw error;
    } finally {
      if (!client) {
        // Only release if we created our own client
        useClient.release();
      }
    }
  }

  /**
   * Get user's feed items with pagination
   * @param userId User ID
   * @param options Query options
   * @returns Feed items and pagination info
   */
  async getUserFeed(userId: string, options: FeedOptions = {}): Promise<FeedResult> {
    try {
      const { 
        limit = 20, 
        before, 
        after,
        includeTypes,
        excludeTypes,
        actorIds,
        unreadOnly = false
      } = options;

      // Start building the query and parameters
      let queryParams: any[] = [userId];
      let paramIndex = 2;
      
      // Build WHERE conditions for activity filtering
      let conditions = ['ufi.user_id = $1', 'ufi.hidden = false'];
      
      // Handle cursor-based pagination
      if (before) {
        conditions.push(`ae.id < $${paramIndex}`);
        queryParams.push(before);
        paramIndex++;
      }
      
      if (after) {
        conditions.push(`ae.id > $${paramIndex}`);
        queryParams.push(after);
        paramIndex++;
      }
      
      // Filter by activity types
      if (includeTypes && includeTypes.length > 0) {
        conditions.push(`ae.object_type || '.' || ae.action = ANY($${paramIndex})`);
        queryParams.push(includeTypes);
        paramIndex++;
      }
      
      if (excludeTypes && excludeTypes.length > 0) {
        conditions.push(`ae.object_type || '.' || ae.action <> ALL($${paramIndex})`);
        queryParams.push(excludeTypes);
        paramIndex++;
      }
      
      // Filter by actors
      if (actorIds && actorIds.length > 0) {
        conditions.push(`ae.actor_id = ANY($${paramIndex})`);
        queryParams.push(actorIds);
        paramIndex++;
      }
      
      // Filter by read status
      if (unreadOnly) {
        conditions.push('ufi.read = false');
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Construct the main query
      const query = `
        SELECT 
          ae.*,
          ufi.read,
          ufi.hidden,
          ufi.added_at,
          u.display_name as actor_display_name,
          p.avatar_url as actor_avatar_url,
          p.level as actor_level
        FROM user_feed_items ufi
        JOIN activity_events ae ON ufi.activity_id = ae.id
        JOIN users u ON ae.actor_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        ${whereClause}
        ORDER BY ae.created_at DESC
        LIMIT $${paramIndex}
      `;
      
      queryParams.push(limit + 1); // Fetch one extra to check for more results
      
      const result = await this.db.query(query, queryParams);
      
      // Check if there are more results
      const hasMore = result.rows.length > limit;
      const items = result.rows.slice(0, limit).map(row => this.mapFeedItemWithDetails(row));
      
      // Get next cursor (for pagination)
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;
      
      // Get unread count
      const unreadQuery = `
        SELECT COUNT(*) as count
        FROM user_feed_items
        WHERE user_id = $1 AND read = false AND hidden = false
      `;
      
      const unreadResult = await this.db.query(unreadQuery, [userId]);
      const unreadCount = parseInt(unreadResult.rows[0].count);
      
      return {
        items,
        hasMore,
        nextCursor,
        unreadCount
      };
    } catch (error) {
      logger.error('Error getting user feed', { error, userId, options });
      throw error;
    }
  }

  /**
   * Mark feed item as read
   * @param userId User ID
   * @param activityId Activity ID
   * @returns True if successful
   */
  async markFeedItemAsRead(userId: string, activityId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE user_feed_items
        SET read = true
        WHERE user_id = $1 AND activity_id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [userId, activityId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error marking feed item as read', { error, userId, activityId });
      throw error;
    }
  }

  /**
   * Mark all feed items as read
   * @param userId User ID
   * @returns Number of items marked as read
   */
  async markAllFeedItemsAsRead(userId: string): Promise<number> {
    try {
      const query = `
        UPDATE user_feed_items
        SET read = true
        WHERE user_id = $1 AND read = false
        RETURNING *
      `;

      const result = await this.db.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error marking all feed items as read', { error, userId });
      throw error;
    }
  }

  /**
   * Hide a feed item
   * @param userId User ID
   * @param activityId Activity ID
   * @returns True if successful
   */
  async hideFeedItem(userId: string, activityId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE user_feed_items
        SET hidden = true
        WHERE user_id = $1 AND activity_id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [userId, activityId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error hiding feed item', { error, userId, activityId });
      throw error;
    }
  }

  /**
   * Delete old activities (for maintenance)
   * @param olderThan Date threshold
   * @returns Number of activities deleted
   */
  async deleteOldActivities(olderThan: Date): Promise<number> {
    try {
      const query = `
        DELETE FROM activity_events
        WHERE created_at < $1
        RETURNING id
      `;

      const result = await this.db.query(query, [olderThan]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting old activities', { error, olderThan });
      throw error;
    }
  }

  /**
   * Map activity from database to model
   * @param row Database row
   * @returns ActivityEvent model
   */
  private mapActivityFromDb(row: any): ActivityEvent {
    return {
      id: row.id,
      actorId: row.actor_id,
      objectType: row.object_type,
      objectId: row.object_id,
      targetType: row.target_type,
      targetId: row.target_id,
      action: row.action,
      data: row.data,
      visibility: row.visibility as ActivityVisibility,
      createdAt: row.created_at
    };
  }

  /**
   * Map feed item from database to model
   * @param row Database row
   * @returns UserFeedItem model
   */
  private mapFeedItemFromDb(row: any): UserFeedItem {
    return {
      userId: row.user_id,
      activityId: row.activity_id,
      addedAt: row.added_at,
      read: row.read,
      hidden: row.hidden
    };
  }

  /**
   * Map feed item with details from database to model
   * @param row Database row
   * @returns FeedItem model
   */
  private mapFeedItemWithDetails(row: any): FeedItem {
    const activityEvent = this.mapActivityFromDb(row);
    
    return {
      ...activityEvent,
      actor: {
        id: row.actor_id,
        displayName: row.actor_display_name,
        avatarUrl: row.actor_avatar_url,
        level: row.actor_level
      },
      read: row.read,
      hidden: row.hidden
    };
  }
}
