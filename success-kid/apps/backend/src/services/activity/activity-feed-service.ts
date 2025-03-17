/**
 * Activity Feed Service
 * 
 * Handles the generation, storage, and delivery of activity feed events
 * with real-time updates via WebSockets.
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { WebSocketService } from '../../websockets/websocket-service';
import { ActivityRepository } from '../../repositories/activity-repository';

/**
 * Activity event options
 */
export interface ActivityOptions {
  /** Actor (subject) ID for the activity */
  actorId: string;
  
  /** Activity verb (action) */
  verb: string;
  
  /** Target ID of the activity (optional) */
  targetId?: string;
  
  /** Target type (content, user, etc.) */
  targetType?: string;
  
  /** Object ID of the activity */
  objectId?: string;
  
  /** Object type */
  objectType?: string;
  
  /** Additional data for the activity */
  data?: Record<string, any>;
  
  /** Activity visibility */
  visibility?: 'public' | 'followers' | 'private';
  
  /** Activity priority */
  priority?: 'low' | 'normal' | 'high';
  
  /** Activity tags for categorization and filtering */
  tags?: string[];
}

/**
 * Feed query options
 */
export interface FeedQueryOptions {
  /** Last activity ID for pagination */
  lastId?: string;
  
  /** Number of items to return */
  limit?: number;
  
  /** Filter by activity types */
  types?: string[];
  
  /** Filter by actor IDs */
  actorIds?: string[];
  
  /** Filter by target IDs */
  targetIds?: string[];
  
  /** Filter by tags */
  tags?: string[];
  
  /** Include activities from followed users */
  includeFollowed?: boolean;
  
  /** Include global activities */
  includeGlobal?: boolean;
}

/**
 * Service to handle activity feed generation and delivery
 */
export class ActivityFeedService {
  private activityRepository: ActivityRepository;
  private eventBus: EventBus;
  private websocketService: WebSocketService;
  private redis: Redis;
  
  /**
   * Create activity feed service
   * @param db Database connection pool
   * @param redis Redis client
   * @param eventBus Event bus instance
   * @param websocketService WebSocket service
   */
  constructor(
    db: Pool,
    redis: Redis,
    eventBus: EventBus,
    websocketService: WebSocketService
  ) {
    this.activityRepository = new ActivityRepository(db);
    this.redis = redis;
    this.eventBus = eventBus;
    this.websocketService = websocketService;
    
    // Subscribe to events that should generate activity
    this.setupEventSubscriptions();
  }
  
  /**
   * Create a new activity event
   * @param options Activity options
   * @returns Created activity
   */
  async createActivity(options: ActivityOptions): Promise<any> {
    try {
      // Generate activity ID
      const activityId = uuidv4();
      
      // Create activity record
      const activity = await this.activityRepository.createActivity({
        id: activityId,
        actorId: options.actorId,
        verb: options.verb,
        targetId: options.targetId,
        targetType: options.targetType,
        objectId: options.objectId,
        objectType: options.objectType,
        data: options.data || {},
        visibility: options.visibility || 'public',
        priority: options.priority || 'normal',
        tags: options.tags || [],
        createdAt: new Date()
      });
      
      // Publish activity created event
      this.eventBus.publish(EventType.ACTIVITY_CREATED, {
        activity,
        metadata: {
          realtime: true
        }
      });
      
      // Send real-time updates via WebSocket
      await this.deliverActivityUpdates(activity);
      
      return activity;
    } catch (error) {
      logger.error('Failed to create activity', { error, options });
      throw error;
    }
  }
  
  /**
   * Get user's activity feed
   * @param userId User ID
   * @param options Query options
   * @returns Activity feed items
   */
  async getUserFeed(userId: string, options: FeedQueryOptions = {}): Promise<any[]> {
    try {
      // Get followed user IDs if requested
      let followedUserIds: string[] = [];
      if (options.includeFollowed) {
        followedUserIds = await this.getFollowedUserIds(userId);
      }
      
      // Get feed items
      const feedItems = await this.activityRepository.getFeedItems({
        userId,
        followedUserIds,
        lastId: options.lastId,
        limit: options.limit || 20,
        types: options.types,
        actorIds: options.actorIds,
        targetIds: options.targetIds,
        tags: options.tags,
        includeGlobal: options.includeGlobal !== false
      });
      
      // Store last viewed timestamp
      await this.redis.set(`user:${userId}:feed:lastViewed`, Date.now());
      
      // Return formatted feed items
      return feedItems.map(item => this.formatFeedItem(item));
    } catch (error) {
      logger.error('Failed to get user feed', { error, userId, options });
      return [];
    }
  }
  
  /**
   * Get global activity feed
   * @param options Query options
   * @returns Activity feed items
   */
  async getGlobalFeed(options: FeedQueryOptions = {}): Promise<any[]> {
    try {
      // Get global feed items
      const feedItems = await this.activityRepository.getGlobalFeedItems({
        lastId: options.lastId,
        limit: options.limit || 20,
        types: options.types,
        actorIds: options.actorIds,
        targetIds: options.targetIds,
        tags: options.tags
      });
      
      // Return formatted feed items
      return feedItems.map(item => this.formatFeedItem(item));
    } catch (error) {
      logger.error('Failed to get global feed', { error, options });
      return [];
    }
  }
  
  /**
   * Get activity by ID
   * @param activityId Activity ID
   * @returns Activity or null if not found
   */
  async getActivityById(activityId: string): Promise<any | null> {
    try {
      const activity = await this.activityRepository.getActivityById(activityId);
      return activity ? this.formatFeedItem(activity) : null;
    } catch (error) {
      logger.error('Failed to get activity by ID', { error, activityId });
      return null;
    }
  }
  
  /**
   * Format feed item for client consumption
   * @param item Raw feed item
   * @returns Formatted feed item
   */
  private formatFeedItem(item: any): any {
    // Basic formatting
    return {
      id: item.id,
      actorId: item.actorId,
      verb: item.verb,
      targetId: item.targetId,
      targetType: item.targetType,
      objectId: item.objectId,
      objectType: item.objectType,
      data: item.data || {},
      createdAt: item.createdAt.toISOString(),
      // Add additional fields as needed
    };
  }
  
  /**
   * Deliver activity updates to relevant users via WebSocket
   * @param activity Activity to deliver
   */
  private async deliverActivityUpdates(activity: any): Promise<void> {
    try {
      // Determine recipients based on activity visibility
      const recipients: Set<string> = new Set();
      
      // Add actor
      recipients.add(activity.actorId);
      
      // Public activities go to global feed
      if (activity.visibility === 'public') {
        // Send to global feed channel
        this.websocketService.sendToChannel('feed:global', {
          type: 'feed.update',
          data: {
            activity: this.formatFeedItem(activity),
            source: 'global',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // For follower-visible activities, add followers
      if (activity.visibility === 'followers' || activity.visibility === 'public') {
        // Get followers for the actor
        const followerIds = await this.getFollowerIds(activity.actorId);
        followerIds.forEach(id => recipients.add(id));
      }
      
      // If target is a user, add them
      if (activity.targetType === 'user' && activity.targetId) {
        recipients.add(activity.targetId);
      }
      
      // Send to individual recipients
      for (const userId of recipients) {
        // Skip if same as actor
        if (userId === activity.actorId) continue;
        
        this.websocketService.sendToUser(userId, {
          type: 'feed.update',
          data: {
            activity: this.formatFeedItem(activity),
            source: 'personal',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Send to specific type channels
      const typeChannel = `feed:type:${activity.verb}`;
      this.websocketService.sendToChannel(typeChannel, {
        type: 'feed.update',
        data: {
          activity: this.formatFeedItem(activity),
          source: 'type',
          type: activity.verb,
          timestamp: new Date().toISOString()
        }
      });
      
      // For high priority activities, send additional notification
      if (activity.priority === 'high') {
        this.websocketService.sendToChannel('feed:highlights', {
          type: 'feed.highlight',
          data: {
            activity: this.formatFeedItem(activity),
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.error('Failed to deliver activity updates', { error, activityId: activity.id });
    }
  }
  
  /**
   * Get IDs of users that the specified user follows
   * @param userId User ID
   * @returns Array of followed user IDs
   */
  private async getFollowedUserIds(userId: string): Promise<string[]> {
    try {
      // TODO: Implement real follower relationship lookup
      // This would query a user_follows or similar table
      
      // Mock implementation
      return [];
    } catch (error) {
      logger.error('Failed to get followed user IDs', { error, userId });
      return [];
    }
  }
  
  /**
   * Get IDs of users following the specified user
   * @param userId User ID
   * @returns Array of follower user IDs
   */
  private async getFollowerIds(userId: string): Promise<string[]> {
    try {
      // TODO: Implement real follower relationship lookup
      // This would query a user_followers or similar table
      
      // Mock implementation
      return [];
    } catch (error) {
      logger.error('Failed to get follower IDs', { error, userId });
      return [];
    }
  }
  
  /**
   * Set up event subscriptions
   */
  private setupEventSubscriptions(): void {
    // Content creation events
    this.eventBus.subscribe(EventType.CONTENT_CREATED, async (data) => {
      try {
        await this.createActivity({
          actorId: data.authorId,
          verb: 'create',
          objectId: data.id,
          objectType: 'content',
          data: {
            contentType: data.type,
            preview: data.preview
          },
          visibility: 'public',
          tags: ['content']
        });
      } catch (error) {
        logger.error('Failed to create activity for content creation', { error, data });
      }
    });
    
    // Comment events
    this.eventBus.subscribe(EventType.COMMENT_CREATED, async (data) => {
      try {
        await this.createActivity({
          actorId: data.authorId,
          verb: 'comment',
          targetId: data.contentId,
          targetType: 'content',
          objectId: data.id,
          objectType: 'comment',
          data: {
            preview: data.preview,
            contentAuthorId: data.contentAuthorId
          },
          visibility: 'public',
          tags: ['comment', 'content']
        });
      } catch (error) {
        logger.error('Failed to create activity for comment', { error, data });
      }
    });
    
    // Achievement events
    this.eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, async (data) => {
      try {
        await this.createActivity({
          actorId: data.userId,
          verb: 'unlock',
          objectId: data.achievement.id,
          objectType: 'achievement',
          data: {
            achievement: data.achievement.name,
            description: data.achievement.description,
            icon: data.achievement.icon
          },
          visibility: 'public',
          priority: 'high',
          tags: ['achievement', 'gamification']
        });
      } catch (error) {
        logger.error('Failed to create activity for achievement', { error, data });
      }
    });
    
    // Level up events
    this.eventBus.subscribe(EventType.LEVEL_UP, async (data) => {
      try {
        await this.createActivity({
          actorId: data.userId,
          verb: 'levelUp',
          objectType: 'level',
          data: {
            level: data.level,
            previousLevel: data.previousLevel
          },
          visibility: 'public',
          priority: 'high',
          tags: ['level', 'gamification']
        });
      } catch (error) {
        logger.error('Failed to create activity for level up', { error, data });
      }
    });
    
    // Wallet connection events
    this.eventBus.subscribe(EventType.WALLET_CONNECTED, async (data) => {
      try {
        await this.createActivity({
          actorId: data.userId,
          verb: 'connect',
          objectType: 'wallet',
          data: {
            walletType: data.walletType,
            // Don't include full address for privacy
            truncatedAddress: truncateWalletAddress(data.walletAddress)
          },
          visibility: 'public',
          tags: ['wallet', 'blockchain']
        });
      } catch (error) {
        logger.error('Failed to create activity for wallet connection', { error, data });
      }
    });
    
    // Market milestone events
    this.eventBus.subscribe(EventType.MARKET_MILESTONE_REACHED, async (data) => {
      try {
        await this.createActivity({
          // Use system user ID for market events
          actorId: 'system',
          verb: 'milestone',
          objectType: 'market',
          data: {
            milestone: data.milestone,
            value: data.value,
            currency: data.currency
          },
          visibility: 'public',
          priority: 'high',
          tags: ['market', 'milestone']
        });
      } catch (error) {
        logger.error('Failed to create activity for market milestone', { error, data });
      }
    });
  }
  
  /**
   * Get feed statistics for a user
   * @param userId User ID
   * @returns Feed statistics
   */
  async getFeedStats(userId: string): Promise<{
    unreadCount: number;
    activityStats: Record<string, number>;
    lastViewedAt: string | null;
  }> {
    try {
      // Get last viewed timestamp
      const lastViewedStr = await this.redis.get(`user:${userId}:feed:lastViewed`);
      const lastViewed = lastViewedStr ? parseInt(lastViewedStr, 10) : null;
      
      // Get unread count
      const unreadCount = lastViewed
        ? await this.activityRepository.getUnreadCount(userId, new Date(lastViewed))
        : 0;
      
      // Get activity stats
      const activityStats = await this.activityRepository.getActivityStats(userId);
      
      return {
        unreadCount,
        activityStats,
        lastViewedAt: lastViewed ? new Date(lastViewed).toISOString() : null
      };
    } catch (error) {
      logger.error('Failed to get feed stats', { error, userId });
      return {
        unreadCount: 0,
        activityStats: {},
        lastViewedAt: null
      };
    }
  }
}

/**
 * Truncate wallet address for privacy
 * @param address Wallet address
 * @returns Truncated address
 */
function truncateWalletAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
