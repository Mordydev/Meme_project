/**
 * Badge Service
 * 
 * Manages badge awards, collections, and user displays
 */
import { Pool } from 'pg';
import { Badge, BadgeCategory, BadgeTier } from '../../models/badge';
import { UserBadge } from '../../models/user-badge';
import { BadgeRepository } from '../../repositories/badge-repository';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsService } from '../points';
import { NotificationService } from '../notifications';

export interface BadgeAward {
  userId: string;
  badgeId: string;
  source: string;
  referenceId?: string;
}

export interface BadgeFilter {
  category?: BadgeCategory;
  tier?: BadgeTier;
  search?: string;
}

export class BadgeService {
  private repository: BadgeRepository;
  private pointsService: PointsService;
  private eventBus: EventBus;
  private notificationService: NotificationService;
  
  constructor(
    db: Pool,
    repository: BadgeRepository,
    pointsService: PointsService,
    eventBus: EventBus,
    notificationService: NotificationService
  ) {
    this.repository = repository;
    this.pointsService = pointsService;
    this.eventBus = eventBus;
    this.notificationService = notificationService;
  }
  
  /**
   * Get all available badges
   */
  async getBadges(filter?: BadgeFilter): Promise<Badge[]> {
    try {
      return this.repository.findBadges(filter);
    } catch (error) {
      logger.error('Error getting badges', { error, filter });
      throw error;
    }
  }
  
  /**
   * Get a specific badge by ID
   */
  async getBadge(id: string): Promise<Badge | null> {
    try {
      return this.repository.findById(id);
    } catch (error) {
      logger.error('Error getting badge', { error, id });
      throw error;
    }
  }
  
  /**
   * Get all badges earned by a user
   */
  async getUserBadges(userId: string, filter?: BadgeFilter): Promise<(UserBadge & Badge)[]> {
    try {
      return this.repository.getUserBadges(userId, filter);
    } catch (error) {
      logger.error('Error getting user badges', { error, userId, filter });
      throw error;
    }
  }
  
  /**
   * Award a badge to a user
   */
  async awardBadge(data: BadgeAward): Promise<UserBadge> {
    try {
      // Check if badge exists
      const badge = await this.repository.findById(data.badgeId);
      if (!badge) {
        throw new Error(`Badge not found with ID ${data.badgeId}`);
      }
      
      // Check if user already has this badge
      const existingBadge = await this.repository.getUserBadge(data.userId, data.badgeId);
      if (existingBadge) {
        logger.info('User already has this badge', { 
          userId: data.userId, 
          badgeId: data.badgeId 
        });
        return existingBadge;
      }
      
      logger.info('Awarding badge to user', { 
        userId: data.userId, 
        badgeId: data.badgeId,
        name: badge.name
      });
      
      // Award the badge
      const userBadge = await this.repository.createUserBadge({
        user_id: data.userId,
        badge_id: data.badgeId,
        awarded_at: new Date(),
        source: data.source,
        reference_id: data.referenceId
      });
      
      // Award points if badge has a points value
      if (badge.points_value > 0) {
        await this.pointsService.awardPoints({
          userId: data.userId,
          amount: badge.points_value,
          source: 'badge_award',
          referenceId: data.badgeId,
          description: `Badge: ${badge.name}`
        });
      }
      
      // Send notification
      await this.notificationService.createNotification({
        userId: data.userId,
        type: 'badge_awarded',
        title: 'New Badge!',
        message: `You've earned the "${badge.name}" badge`,
        data: {
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          imageUrl: badge.image_url,
          tier: badge.tier,
          category: badge.category,
          pointsValue: badge.points_value
        }
      });
      
      // Emit badge awarded event
      this.eventBus.publish('badge:awarded', {
        userId: data.userId,
        badge: {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          imageUrl: badge.image_url,
          tier: badge.tier,
          category: badge.category,
          pointsValue: badge.points_value
        },
        source: data.source,
        awardedAt: userBadge.awarded_at
      });
      
      return userBadge;
    } catch (error) {
      logger.error('Error awarding badge', { 
        error, 
        userId: data.userId, 
        badgeId: data.badgeId 
      });
      throw error;
    }
  }
  
  /**
   * Get badges to display on user profile (with limits)
   */
  async getDisplayableBadges(
    userId: string, 
    limit: number = 5
  ): Promise<(UserBadge & Badge)[]> {
    try {
      return this.repository.getDisplayableBadges(userId, limit);
    } catch (error) {
      logger.error('Error getting displayable badges', { error, userId, limit });
      throw error;
    }
  }
  
  /**
   * Update which badges a user has equipped/displayed
   */
  async updateEquippedBadges(
    userId: string, 
    badgeIds: string[]
  ): Promise<number> {
    try {
      // First reset all badges for user
      await this.repository.resetEquippedBadges(userId);
      
      // Then set the equipped ones
      const results = await Promise.all(
        badgeIds.map(badgeId => 
          this.repository.updateUserBadge(userId, badgeId, { equipped: true })
        )
      );
      
      return results.filter(Boolean).length;
    } catch (error) {
      logger.error('Error updating equipped badges', { error, userId, badgeIds });
      throw error;
    }
  }
  
  /**
   * Get badge statistics
   */
  async getBadgeStats(): Promise<{
    badgeId: string;
    name: string;
    tier: BadgeTier;
    category: BadgeCategory;
    awardCount: number;
    awardRate: number;
  }[]> {
    try {
      return this.repository.getBadgeStats();
    } catch (error) {
      logger.error('Error getting badge stats', { error });
      throw error;
    }
  }
  
  /**
   * Get recommended badges for a user to earn next
   */
  async getRecommendedBadges(userId: string, limit: number = 5): Promise<Badge[]> {
    try {
      return this.repository.getRecommendedBadges(userId, limit);
    } catch (error) {
      logger.error('Error getting recommended badges', { error, userId, limit });
      throw error;
    }
  }
  
  /**
   * Revoke a badge (for admin/moderation purposes)
   */
  async revokeBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      return this.repository.deleteUserBadge(userId, badgeId);
    } catch (error) {
      logger.error('Error revoking badge', { error, userId, badgeId });
      throw error;
    }
  }
}
