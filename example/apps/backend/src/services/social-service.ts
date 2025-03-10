import { SocialRepository } from '../repositories/social-repository';
import { EventEmitter, EventType } from '../lib/events';
import { TransactionManager } from '../lib/transaction';
import { AppError } from '../lib/errors';
import { Reaction, Follow } from '../models/social';
import { ContentRepository } from '../repositories/content-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { NotificationService } from './notification-service';

/**
 * Rate limiting configuration for social actions
 */
export const SOCIAL_RATE_LIMITS = {
  reactions: { interval: 60000, maxRequests: 30 },  // 30 reactions per minute
  follows: { interval: 60000, maxRequests: 20 },    // 20 follows per minute
  unfollows: { interval: 60000, maxRequests: 20 }   // 20 unfollows per minute
};

/**
 * User relationship status interface
 */
export interface UserRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  mutualFollow: boolean;
}

/**
 * Service for managing social interactions including reactions and follows
 */
export class SocialService {
  constructor(
    private socialRepository: SocialRepository,
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter,
    private transactionManager: TransactionManager
  ) {}

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Listen for reaction events
    this.eventEmitter.on(EventType.CONTENT_REACTION_ADDED, async (data) => {
      try {
        // Create notification for reaction
        await this.notificationService.createNotification({
          userId: data.userId,
          targetUserId: await this.getTargetUserId('content', data.contentId),
          type: 'reaction',
          referenceType: 'content',
          referenceId: data.contentId,
          data: {
            reactionType: data.reactionType
          }
        });
      } catch (error) {
        console.error('Error processing reaction event:', error);
      }
    });

    // Listen for follow events
    this.eventEmitter.on(EventType.USER_FOLLOWED, async (data) => {
      try {
        // Create notification for new follower
        await this.notificationService.createNotification({
          userId: data.followerId,
          targetUserId: data.followedId,
          type: 'follow',
          referenceType: 'user',
          referenceId: data.followerId
        });
      } catch (error) {
        console.error('Error processing follow event:', error);
      }
    });
  }

  /**
   * Create or update a reaction
   */
  async createReaction(
    userId: string, 
    targetType: 'content' | 'comment', 
    targetId: string,
    reactionType: string
  ): Promise<Reaction> {
    return this.transactionManager.execute(async (transaction) => {
      // Validate target exists
      const target = await this.getTargetEntity(targetType, targetId, transaction);
      
      if (!target) {
        throw AppError.notFound(targetType, targetId);
      }
      
      // Check if reaction already exists
      const existing = await this.socialRepository.findUserReaction(
        userId, targetType, targetId, transaction
      );
      
      let reaction;
      if (existing) {
        // If same reaction type, delete it (toggle off)
        if (existing.type === reactionType) {
          await this.socialRepository.deleteReaction(existing.id, transaction);
          
          // Update target metrics
          await this.updateTargetMetrics(targetType, targetId, reactionType, false, transaction);
          
          // Emit event
          await this.eventEmitter.emit(EventType.CONTENT_REACTION_REMOVED, {
            contentId: targetType === 'content' ? targetId : undefined,
            commentId: targetType === 'comment' ? targetId : undefined,
            userId,
            reactionType,
            timestamp: new Date().toISOString()
          });
          
          return existing;
        }
        
        // Otherwise, update the reaction type
        reaction = await this.socialRepository.createReaction({
          ...existing,
          type: reactionType,
          createdAt: new Date()
        }, transaction);
        
        // Update target metrics (remove old, add new)
        await this.updateTargetMetrics(targetType, targetId, existing.type, false, transaction);
        await this.updateTargetMetrics(targetType, targetId, reactionType, true, transaction);
      } else {
        // Create new reaction
        reaction = await this.socialRepository.createReaction({
          userId,
          targetType,
          targetId,
          type: reactionType,
          createdAt: new Date()
        }, transaction);
        
        // Update target metrics
        await this.updateTargetMetrics(targetType, targetId, reactionType, true, transaction);
      }
      
      // Emit event
      await this.eventEmitter.emit(
        targetType === 'content' ? EventType.CONTENT_REACTION_ADDED : EventType.CONTENT_REACTION_ADDED,
        {
          contentId: targetType === 'content' ? targetId : undefined,
          commentId: targetType === 'comment' ? targetId : undefined,
          userId,
          reactionType,
          timestamp: new Date().toISOString()
        }
      );
      
      return reaction;
    });
  }

  /**
   * Get reactions for a target
   */
  async getReactions(
    targetType: 'content' | 'comment',
    targetId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ reactions: Reaction[]; total: number }> {
    // Validate target exists
    const target = await this.getTargetEntity(targetType, targetId);
    
    if (!target) {
      throw AppError.notFound(targetType, targetId);
    }
    
    return this.socialRepository.getReactionsForTarget(targetType, targetId, options);
  }

  /**
   * Get reaction counts for a target
   */
  async getReactionCounts(
    targetType: 'content' | 'comment',
    targetId: string
  ): Promise<Record<string, number>> {
    // Validate target exists
    const target = await this.getTargetEntity(targetType, targetId);
    
    if (!target) {
      throw AppError.notFound(targetType, targetId);
    }
    
    return this.socialRepository.getReactionCounts(targetType, targetId);
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followedId: string): Promise<Follow> {
    // Cannot follow yourself
    if (followerId === followedId) {
      throw AppError.validation('You cannot follow yourself');
    }
    
    // Verify followed user exists
    const followed = await this.contentRepository.db
      .from('user_profiles')
      .select('id')
      .eq('id', followedId)
      .maybeSingle();
    
    if (!followed.data) {
      throw AppError.notFound('user', followedId);
    }
    
    return this.transactionManager.execute(async (transaction) => {
      // Check if already following
      const isFollowing = await this.socialRepository.checkFollowExists(followerId, followedId);
      
      if (isFollowing) {
        throw AppError.validation('You are already following this user');
      }
      
      // Create follow relationship
      const follow = await this.socialRepository.createFollow(followerId, followedId, transaction);
      
      // Emit event
      await this.eventEmitter.emit(EventType.USER_FOLLOWED, {
        followerId,
        followedId,
        timestamp: new Date().toISOString()
      });
      
      return follow;
    });
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    // Check if actually following
    const isFollowing = await this.socialRepository.checkFollowExists(followerId, followedId);
    
    if (!isFollowing) {
      throw AppError.validation('You are not following this user');
    }
    
    return this.transactionManager.execute(async (transaction) => {
      // Remove follow relationship
      await this.socialRepository.deleteFollow(followerId, followedId, transaction);
      
      // Emit event
      await this.eventEmitter.emit(EventType.USER_UNFOLLOWED, {
        followerId,
        followedId,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ followers: Follow[]; total: number }> {
    return this.socialRepository.getUserFollowers(userId, options);
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ following: Follow[]; total: number }> {
    return this.socialRepository.getUserFollowing(userId, options);
  }

  /**
   * Get follow counts for a user
   */
  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    return this.socialRepository.getFollowCounts(userId);
  }

  /**
   * Check if user follows another user
   */
  async checkFollowStatus(followerId: string, followedId: string): Promise<boolean> {
    return this.socialRepository.checkFollowExists(followerId, followedId);
  }

  /**
   * Get comprehensive relationship status between users
   */
  async getUserRelationship(userId: string, otherUserId: string): Promise<UserRelationship> {
    // Execute both checks in parallel for efficiency
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.socialRepository.checkFollowExists(userId, otherUserId),
      this.socialRepository.checkFollowExists(otherUserId, userId)
    ]);

    return {
      isFollowing,
      isFollowedBy,
      mutualFollow: isFollowing && isFollowedBy
    };
  }

  /**
   * Get suggested users to follow based on common interests, followers, and patterns
   */
  async getSuggestedFollows(userId: string, limit = 10): Promise<any[]> {
    return this.transactionManager.execute(async (transaction) => {
      // Get current user's following list
      const { following } = await this.socialRepository.getUserFollowing(userId);
      const followingIds = following.map(f => f.followedId);

      // Don't suggest users the current user already follows
      const excludeIds = [...followingIds, userId];

      // Get followers of followed users (users who follow the same people)
      const suggestedUsersByNetwork = await this.socialRepository.getSuggestedUsersByNetwork(
        userId,
        excludeIds,
        { limit: limit * 2 } // Get extra to allow for filtering
      );

      // Get popular creators as fallback suggestions
      const popularCreators = await this.socialRepository.getPopularCreators(
        excludeIds,
        { limit }
      );

      // Combine and prioritize suggestions
      const suggestions = [...suggestedUsersByNetwork];

      // Add popular creators if we need more suggestions
      if (suggestions.length < limit) {
        const needed = limit - suggestions.length;
        suggestions.push(...popularCreators.slice(0, needed));
      }

      // Limit to requested amount and ensure no duplicates
      const uniqueSuggestions = [...new Map(suggestions.map(s => [s.id, s])).values()];
      return uniqueSuggestions.slice(0, limit);
    });
  }

  /**
   * Update target metrics for reactions
   */
  private async updateTargetMetrics(
    targetType: 'content' | 'comment',
    targetId: string,
    reactionType: string,
    increment: boolean,
    transaction?: any
  ): Promise<void> {
    if (targetType === 'content') {
      await this.contentRepository.updateReactionCount(targetId, reactionType, increment);
    } else if (targetType === 'comment') {
      await this.commentRepository.updateReactionCount(targetId, reactionType, increment);
    }
  }

  /**
   * Get target entity (content or comment)
   */
  private async getTargetEntity(
    targetType: 'content' | 'comment',
    targetId: string,
    transaction?: any
  ): Promise<any> {
    if (targetType === 'content') {
      return this.contentRepository.findById(targetId);
    } else if (targetType === 'comment') {
      return this.commentRepository.findById(targetId);
    }
    
    return null;
  }

  /**
   * Get the user ID for a target entity owner
   */
  private async getTargetUserId(
    targetType: 'content' | 'comment',
    targetId: string
  ): Promise<string> {
    const target = await this.getTargetEntity(targetType, targetId);
    
    if (!target) {
      throw AppError.notFound(targetType, targetId);
    }
    
    return targetType === 'content' ? target.creatorId : target.userId;
  }
}
