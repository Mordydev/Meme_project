/**
 * Activity Service
 * 
 * Central service for handling activity events and feed generation.
 */
import { v4 as uuid } from 'uuid';
import {
  ActivityEvent,
  ActivityType,
  ActivityVisibility,
  CreateActivityEventDto,
  FeedItem,
  FeedOptions,
  AggregatedActivity
} from './models';
import { activityRepository } from './repository';
import { logger } from '../lib/logger';
import { eventBus, EventType } from '../lib/event-bus';
import { connectionManager } from '../websockets/connection-manager';

/**
 * Activity service class
 */
export class ActivityService {
  /**
   * Create a new activity event
   * 
   * @param activityData Activity data to create
   * @returns Created activity
   */
  async createActivity(activityData: CreateActivityEventDto): Promise<ActivityEvent> {
    try {
      // Create activity in database
      const activity = await activityRepository.createActivity(activityData);
      
      // Process for feeds (async)
      this.processActivityAsync(activity);
      
      // Emit event for real-time updates
      eventBus.publish(EventType.ACTIVITY_CREATED, {
        activityId: activity.id,
        type: activity.type,
        actorId: activity.actorId,
        visibility: activity.visibility
      });
      
      return activity;
    } catch (error) {
      logger.error('Failed to create activity', { error, activityData });
      throw new Error('Failed to create activity');
    }
  }

  /**
   * Process activity for feeds asynchronously
   * 
   * @param activity Activity to process
   */
  private async processActivityAsync(activity: ActivityEvent): Promise<void> {
    // Use setImmediate to process async without blocking
    setImmediate(async () => {
      try {
        // Process activity for feeds
        const result = await activityRepository.processActivityForFeeds(activity);
        
        // Send real-time updates to relevant users
        this.sendRealtimeUpdates(activity);
        
        logger.debug('Activity processed for feeds', { 
          activityId: activity.id, 
          feedItemCount: result.count 
        });
      } catch (error) {
        logger.error('Failed to process activity for feeds', { 
          error, 
          activityId: activity.id 
        });
      }
    });
  }

  /**
   * Send real-time updates for an activity
   * 
   * @param activity Activity to send updates for
   */
  private async sendRealtimeUpdates(activity: ActivityEvent): Promise<void> {
    try {
      let recipients: string[] = [];
      
      // Determine recipients based on visibility
      if (activity.visibility === ActivityVisibility.PUBLIC) {
        // For public activities, notify the actor and potential targets
        recipients.push(activity.actorId);
        if (activity.targetId) {
          recipients.push(activity.targetId);
        }
        
        // In a real implementation, could include global feed subscribers
      } else if (activity.visibility === ActivityVisibility.FOLLOWERS) {
        // For follower activities, notify followers
        const followers = await activityRepository.getUserFollowers(activity.actorId);
        recipients = followers.map(f => f.sourceId);
        
        // Also include actor and target
        recipients.push(activity.actorId);
        if (activity.targetId) {
          recipients.push(activity.targetId);
        }
      } else if (activity.visibility === ActivityVisibility.PRIVATE) {
        // For private activities, only notify actor and target
        recipients.push(activity.actorId);
        if (activity.targetId) {
          recipients.push(activity.targetId);
        }
      }
      
      // Deduplicate recipients
      const uniqueRecipients = [...new Set(recipients)];
      
      // Prepare activity message
      const message = {
        type: 'activity',
        payload: {
          id: activity.id,
          type: activity.type,
          actorId: activity.actorId,
          data: activity.data,
          createdAt: activity.createdAt.toISOString()
        }
      };
      
      // Send to each recipient with an active connection
      for (const userId of uniqueRecipients) {
        if (connectionManager.isUserOnline(userId)) {
          connectionManager.sendToUser(userId, message.type, message.payload);
        }
      }
    } catch (error) {
      logger.error('Failed to send real-time activity updates', { 
        error, 
        activityId: activity.id 
      });
    }
  }

  /**
   * Get an activity by ID
   * 
   * @param id Activity ID
   * @returns Activity or null if not found
   */
  async getActivityById(id: string): Promise<ActivityEvent | null> {
    try {
      return await activityRepository.getActivityById(id);
    } catch (error) {
      logger.error('Failed to get activity', { error, id });
      throw new Error('Failed to get activity');
    }
  }

  /**
   * Get user feed
   * 
   * @param userId User ID
   * @param options Feed options
   * @returns Feed items
   */
  async getUserFeed(userId: string, options: FeedOptions = {}): Promise<FeedItem[]> {
    try {
      return await activityRepository.getFeedForUser(userId, options);
    } catch (error) {
      logger.error('Failed to get user feed', { error, userId });
      throw new Error('Failed to get user feed');
    }
  }

  /**
   * Get aggregated user feed (grouped by similar activities)
   * 
   * @param userId User ID
   * @param options Feed options
   * @returns Aggregated activities
   */
  async getAggregatedUserFeed(userId: string, options: FeedOptions = {}): Promise<AggregatedActivity[]> {
    try {
      // Get raw feed items
      const feedItems = await this.getUserFeed(userId, options);
      
      // Group by activity type and time proximity
      return this.aggregateActivities(feedItems);
    } catch (error) {
      logger.error('Failed to get aggregated user feed', { error, userId });
      throw new Error('Failed to get aggregated user feed');
    }
  }

  /**
   * Aggregate feed items into grouped activities
   * 
   * @param feedItems Feed items to aggregate
   * @returns Aggregated activities
   */
  private aggregateActivities(feedItems: FeedItem[]): AggregatedActivity[] {
    // Group feed items by type and actor, within a time window
    const grouped = new Map<string, FeedItem[]>();
    
    // Sort by newest first
    const sortedItems = [...feedItems].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    sortedItems.forEach(item => {
      // For some types, we want to group by more than just type and actor
      let groupKey = '';
      
      switch (item.type) {
        // Group comments on the same content
        case ActivityType.CONTENT_COMMENTED:
          const contentId = item.data?.contentId;
          groupKey = `${item.type}:${contentId || 'unknown'}`;
          break;
        
        // Group reactions on the same content
        case ActivityType.CONTENT_REACTION:
          const reactionContentId = item.data?.contentId;
          groupKey = `${item.type}:${reactionContentId || 'unknown'}`;
          break;
        
        // Don't group certain activities
        case ActivityType.MILESTONE_REACHED:
        case ActivityType.ACHIEVEMENT_UNLOCKED:
        case ActivityType.USER_JOINED:
        case ActivityType.WALLET_CONNECTED:
          groupKey = `${item.type}:${item.id}`; // Unique group for each
          break;
        
        // Default grouping by type and actor
        default:
          groupKey = `${item.type}:${item.actorId}`;
      }
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      
      grouped.get(groupKey)?.push(item);
    });
    
    // Convert groups to aggregated activities
    const aggregated: AggregatedActivity[] = [];
    
    for (const [key, items] of grouped.entries()) {
      if (items.length === 0) continue;
      
      // Use the most recent item as the primary
      const primaryItem = items[0];
      
      aggregated.push({
        primaryActivity: primaryItem,
        actorId: primaryItem.actorId,
        actorName: this.getActorName(primaryItem), // This would come from a user service
        actorAvatar: this.getActorAvatar(primaryItem), // This would come from a user service
        type: primaryItem.type,
        count: items.length,
        relatedActivities: items.slice(1),
        createdAt: primaryItem.createdAt
      });
    }
    
    // Sort by newest first
    aggregated.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return aggregated;
  }

  /**
   * Mark feed items as read
   * 
   * @param feedItemIds Feed item IDs to mark as read
   * @param userId User ID for verification
   * @returns Number of items updated
   */
  async markFeedItemsAsRead(feedItemIds: string[], userId: string): Promise<number> {
    try {
      return await activityRepository.markFeedItemsAsRead(feedItemIds, userId);
    } catch (error) {
      logger.error('Failed to mark feed items as read', { error, feedItemIds, userId });
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
    try {
      return await activityRepository.markAllFeedItemsAsRead(userId);
    } catch (error) {
      logger.error('Failed to mark all feed items as read', { error, userId });
      throw new Error('Failed to mark feed items as read');
    }
  }

  /**
   * Get actor name (placeholder)
   * 
   * @param activity Activity with actor
   * @returns Actor name
   */
  private getActorName(activity: FeedItem): string {
    // In a real implementation, this would fetch the user name from a user service
    return `User ${activity.actorId}`;
  }

  /**
   * Get actor avatar (placeholder)
   * 
   * @param activity Activity with actor
   * @returns Actor avatar URL
   */
  private getActorAvatar(activity: FeedItem): string {
    // In a real implementation, this would fetch the user avatar from a user service
    return `https://ui-avatars.com/api/?name=User+${activity.actorId}&background=random`;
  }
}

// Export singleton instance
export const activityService = new ActivityService();
