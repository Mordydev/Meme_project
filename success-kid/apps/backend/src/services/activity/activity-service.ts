/**
 * Activity Feed Service
 * 
 * Handles activity event creation and feed management
 */
import { Pool } from 'pg';
import { 
  ActivityEvent, 
  CreateActivityEventDto, 
  ActivityVisibility,
  ActivityType,
  FeedOptions,
  FeedResult,
  AggregatedActivity
} from '../../models/activity';
import { ActivityRepository } from '../../repositories/activity-repository';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';

/**
 * Service for managing activity feeds
 */
export class ActivityService {
  constructor(private activityRepository: ActivityRepository) {}

  /**
   * Create a new activity event
   * 
   * @param activity Activity creation parameters
   * @returns Created activity
   */
  async createActivity(activity: CreateActivityEventDto): Promise<ActivityEvent> {
    try {
      // Create activity in database
      const createdActivity = await this.activityRepository.createActivity(activity);
      
      // Process activity for feeds (add to relevant users' feeds)
      let targetUserIds: string[] = [];
      
      // Add target user if specified
      if (activity.targetId && activity.targetType === 'user') {
        targetUserIds.push(activity.targetId);
      }
      
      // Process additional target users based on activity type
      switch (`${activity.objectType}.${activity.action}`) {
        case 'content.mention':
          // For mentions, add mentioned users from data
          if (activity.data?.mentionedUserIds && Array.isArray(activity.data.mentionedUserIds)) {
            targetUserIds = [...targetUserIds, ...activity.data.mentionedUserIds];
          }
          break;
          
        case 'content.comment':
          // For comments, add content author
          if (activity.data?.contentAuthorId) {
            targetUserIds.push(activity.data.contentAuthorId);
          }
          break;
          
        case 'content.reaction':
          // For reactions, add content author
          if (activity.data?.contentAuthorId) {
            targetUserIds.push(activity.data.contentAuthorId);
          }
          break;
      }
      
      // Process activity for users' feeds
      const feedCount = await this.activityRepository.processActivityForFeeds(
        createdActivity,
        targetUserIds
      );
      
      // Publish event
      await eventBus.publish(EventType.ACTIVITY_CREATED, {
        activity: createdActivity,
        feedCount
      });
      
      return createdActivity;
    } catch (error) {
      logger.error('Error creating activity', { error, activity });
      throw error;
    }
  }

  /**
   * Get user's activity feed with pagination
   * 
   * @param userId User ID
   * @param options Query options
   * @returns Feed items and pagination info
   */
  async getUserFeed(userId: string, options: FeedOptions = {}): Promise<FeedResult> {
    try {
      return await this.activityRepository.getUserFeed(userId, options);
    } catch (error) {
      logger.error('Error getting user feed', { error, userId, options });
      throw error;
    }
  }

  /**
   * Mark feed item as read
   * 
   * @param userId User ID
   * @param activityId Activity ID
   * @returns True if successful
   */
  async markFeedItemAsRead(userId: string, activityId: string): Promise<boolean> {
    try {
      const result = await this.activityRepository.markFeedItemAsRead(userId, activityId);
      
      if (result) {
        // Publish event for real-time updates
        await eventBus.publish(EventType.FEED_UPDATED, {
          userId,
          activityId,
          action: 'read'
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error marking feed item as read', { error, userId, activityId });
      throw error;
    }
  }

  /**
   * Mark all feed items as read for a user
   * 
   * @param userId User ID
   * @returns Number of items marked as read
   */
  async markAllFeedItemsAsRead(userId: string): Promise<number> {
    try {
      const count = await this.activityRepository.markAllFeedItemsAsRead(userId);
      
      if (count > 0) {
        // Publish event for real-time updates
        await eventBus.publish(EventType.FEED_UPDATED, {
          userId,
          action: 'read_all',
          count
        });
      }
      
      return count;
    } catch (error) {
      logger.error('Error marking all feed items as read', { error, userId });
      throw error;
    }
  }

  /**
   * Hide a feed item
   * 
   * @param userId User ID
   * @param activityId Activity ID
   * @returns True if successful
   */
  async hideFeedItem(userId: string, activityId: string): Promise<boolean> {
    try {
      const result = await this.activityRepository.hideFeedItem(userId, activityId);
      
      if (result) {
        // Publish event for real-time updates
        await eventBus.publish(EventType.FEED_UPDATED, {
          userId,
          activityId,
          action: 'hidden'
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error hiding feed item', { error, userId, activityId });
      throw error;
    }
  }

  /**
   * Get activities by actor ID
   * 
   * @param actorId Actor ID (user)
   * @param limit Maximum number of activities to return
   * @returns Array of activities
   */
  async getActivitiesByActor(actorId: string, limit = 20): Promise<ActivityEvent[]> {
    try {
      // This is a placeholder for implementation
      // In a real system, this would get activities from the repository
      return [];
    } catch (error) {
      logger.error('Error getting activities by actor', { error, actorId });
      throw error;
    }
  }

  /**
   * Create a points earned activity
   * 
   * @param userId User ID
   * @param amount Points amount
   * @param source Points source
   * @returns Created activity
   */
  async createPointsEarnedActivity(
    userId: string,
    amount: number,
    source: string
  ): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'points',
      objectId: userId,
      action: 'earned',
      data: {
        amount,
        source
      },
      visibility: ActivityVisibility.PRIVATE // Points activities are private to the user
    });
  }

  /**
   * Create a points redeemed activity
   * 
   * @param userId User ID
   * @param amount Points amount
   * @param tokenAmount Token amount
   * @returns Created activity
   */
  async createPointsRedeemedActivity(
    userId: string,
    amount: number,
    tokenAmount: number
  ): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'points',
      objectId: userId,
      action: 'redeemed',
      data: {
        amount,
        tokenAmount
      },
      visibility: ActivityVisibility.PRIVATE // Redemption activities are private to the user
    });
  }

  /**
   * Create an achievement unlocked activity
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param achievementName Achievement name
   * @param points Points awarded
   * @returns Created activity
   */
  async createAchievementUnlockedActivity(
    userId: string,
    achievementId: string,
    achievementName: string,
    points: number
  ): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'achievement',
      objectId: achievementId,
      action: 'unlocked',
      data: {
        name: achievementName,
        points
      },
      visibility: ActivityVisibility.PUBLIC // Achievement activities are public
    });
  }

  /**
   * Create a level up activity
   * 
   * @param userId User ID
   * @param level New level
   * @returns Created activity
   */
  async createLevelUpActivity(userId: string, level: number): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'user',
      objectId: userId,
      action: 'levelUp',
      data: {
        level
      },
      visibility: ActivityVisibility.PUBLIC // Level up activities are public
    });
  }

  /**
   * Create a content created activity
   * 
   * @param userId User ID
   * @param contentId Content ID
   * @param contentType Content type
   * @param preview Content preview
   * @returns Created activity
   */
  async createContentCreatedActivity(
    userId: string,
    contentId: string,
    contentType: string,
    preview: string
  ): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'content',
      objectId: contentId,
      action: 'created',
      data: {
        type: contentType,
        preview
      },
      visibility: ActivityVisibility.PUBLIC // Content activities are public
    });
  }

  /**
   * Create a content comment activity
   * 
   * @param userId User ID
   * @param contentId Content ID
   * @param commentId Comment ID
   * @param contentAuthorId Content author ID
   * @param preview Comment preview
   * @returns Created activity
   */
  async createContentCommentActivity(
    userId: string,
    contentId: string,
    commentId: string,
    contentAuthorId: string,
    preview: string
  ): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'content',
      objectId: contentId,
      action: 'commented',
      data: {
        commentId,
        contentAuthorId,
        preview
      },
      visibility: ActivityVisibility.PUBLIC // Comment activities are public
    });
  }

  /**
   * Create a content reaction activity
   * 
   * @param userId User ID
   * @param contentId Content ID
   * @param contentAuthorId Content author ID
   * @param reactionType Reaction type
   * @returns Created activity
   */
  async createContentReactionActivity(
    userId: string,
    contentId: string,
    contentAuthorId: string,
    reactionType: string
  ): Promise<ActivityEvent> {
    return this.createActivity({
      actorId: userId,
      objectType: 'content',
      objectId: contentId,
      action: 'reacted',
      data: {
        contentAuthorId,
        reactionType
      },
      visibility: ActivityVisibility.PUBLIC // Reaction activities are public
    });
  }

  /**
   * Maintenance task: Delete old activities
   * 
   * @param days Number of days to keep
   * @returns Number of activities deleted
   */
  async cleanupOldActivities(days = 30): Promise<number> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      
      return await this.activityRepository.deleteOldActivities(threshold);
    } catch (error) {
      logger.error('Error cleaning up old activities', { error, days });
      throw error;
    }
  }
}
