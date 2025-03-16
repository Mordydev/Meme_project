/**
 * Badge Service
 * 
 * Service for managing badges, user badge awards, and badge display.
 */
import { logger } from '../../lib/logger';
import { EventBus } from '../../lib/event-bus';
import { BadgeRepository } from '../../repositories/achievement/badge-repository';
import { PointsService } from '../points/points-service';
import {
  Badge,
  BadgeFilter,
  UserBadge,
  CreateBadgeDto,
  UpdateBadgeDto,
  BadgeAwardRequest,
  BadgeEquipRequest,
  BadgeAwardedEvent,
  MAX_EQUIPPED_BADGES
} from '../../models/entities/achievement/badge.model';
import { NotFoundError, ValidationError } from '../../errors';

/**
 * Service for managing badges
 */
export class BadgeService {
  /**
   * Create a new BadgeService
   * 
   * @param badgeRepository Repository for badge data access
   * @param pointsService Service for awarding points
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private badgeRepository: BadgeRepository,
    private pointsService: PointsService,
    private eventBus: EventBus
  ) {}

  /**
   * Get all badges
   * 
   * @param filter Optional filter criteria
   * @returns Array of badges
   */
  async getBadges(filter?: BadgeFilter): Promise<Badge[]> {
    try {
      if (filter) {
        return this.badgeRepository.findByFilter(filter);
      } else {
        return this.badgeRepository.findAll();
      }
    } catch (error) {
      logger.error('Error getting badges', { filter, error });
      throw error;
    }
  }

  /**
   * Get badge by ID
   * 
   * @param id Badge ID
   * @returns Badge or null if not found
   */
  async getBadgeById(id: string): Promise<Badge | null> {
    try {
      return this.badgeRepository.findById(id);
    } catch (error) {
      logger.error('Error getting badge by ID', { id, error });
      throw error;
    }
  }

  /**
   * Create a new badge
   * 
   * @param data Badge data
   * @returns Created badge
   */
  async createBadge(data: CreateBadgeDto): Promise<Badge> {
    try {
      return this.badgeRepository.createBadge(data);
    } catch (error) {
      logger.error('Error creating badge', { data, error });
      throw error;
    }
  }

  /**
   * Update a badge
   * 
   * @param id Badge ID
   * @param data Badge data to update
   * @returns Updated badge
   */
  async updateBadge(id: string, data: UpdateBadgeDto): Promise<Badge | null> {
    try {
      // Check if badge exists
      const badge = await this.badgeRepository.findById(id);
      if (!badge) {
        throw new NotFoundError('Badge not found');
      }
      
      return this.badgeRepository.updateBadge(id, data);
    } catch (error) {
      logger.error('Error updating badge', { id, data, error });
      throw error;
    }
  }

  /**
   * Delete a badge
   * 
   * @param id Badge ID
   * @returns True if badge was deleted
   */
  async deleteBadge(id: string): Promise<boolean> {
    try {
      return this.badgeRepository.delete(id);
    } catch (error) {
      logger.error('Error deleting badge', { id, error });
      throw error;
    }
  }

  /**
   * Get user's badges
   * 
   * @param userId User ID
   * @returns Array of user badges with badge info
   */
  async getUserBadges(userId: string): Promise<any[]> {
    try {
      return this.badgeRepository.getUserBadges(userId);
    } catch (error) {
      logger.error('Error getting user badges', { userId, error });
      throw error;
    }
  }

  /**
   * Get user's equipped badges
   * 
   * @param userId User ID
   * @returns Array of equipped badges
   */
  async getEquippedBadges(userId: string): Promise<any[]> {
    try {
      return this.badgeRepository.getEquippedBadges(userId);
    } catch (error) {
      logger.error('Error getting equipped badges', { userId, error });
      throw error;
    }
  }

  /**
   * Award a badge to a user
   * 
   * @param request Badge award request
   * @returns Awarded user badge
   */
  async awardBadge(request: BadgeAwardRequest): Promise<UserBadge> {
    try {
      const { userId, badgeId, source, reason } = request;
      
      // Check if badge exists
      const badge = await this.badgeRepository.findById(badgeId);
      if (!badge) {
        throw new NotFoundError('Badge not found');
      }
      
      // Check if user already has this badge
      const hasBadge = await this.badgeRepository.userHasBadge(userId, badgeId);
      if (hasBadge) {
        throw new ValidationError('User already has this badge');
      }
      
      // Award the badge
      const userBadge = await this.badgeRepository.awardBadge(userId, badgeId, source);
      
      // Award points if badge has points value
      if (badge.points_value > 0) {
        await this.pointsService.awardPoints({
          userId,
          amount: badge.points_value,
          source: 'badge_award',
          referenceId: badgeId,
          description: `Badge: ${badge.name}`
        });
      }
      
      // Emit badge awarded event
      const badgeEvent: BadgeAwardedEvent = {
        userId,
        badgeId,
        badge: {
          name: badge.name,
          description: badge.description,
          imageUrl: badge.image_url,
          tier: badge.tier,
          category: badge.category,
          pointsValue: badge.points_value
        },
        source,
        timestamp: new Date()
      };
      
      await this.eventBus.publish('badge.awarded', badgeEvent);
      
      logger.info(`Badge awarded to user`, { 
        userId, 
        badgeId: badge.id, 
        name: badge.name,
        source
      });
      
      return userBadge;
    } catch (error) {
      logger.error('Error awarding badge', { request, error });
      throw error;
    }
  }

  /**
   * Equip or unequip a badge
   * 
   * @param userId User ID
   * @param badgeId Badge ID
   * @param request Equip request
   * @returns Updated user badge
   */
  async toggleEquipBadge(
    userId: string,
    badgeId: string,
    request: BadgeEquipRequest
  ): Promise<UserBadge | null> {
    try {
      const { equipped, slot } = request;
      
      // Check if badge exists
      const badge = await this.badgeRepository.findById(badgeId);
      if (!badge) {
        throw new NotFoundError('Badge not found');
      }
      
      // Check if user has the badge
      const hasBadge = await this.badgeRepository.userHasBadge(userId, badgeId);
      if (!hasBadge) {
        throw new ValidationError('User does not have this badge');
      }
      
      // If equipping, check if slot is valid
      if (equipped && slot !== undefined) {
        if (slot < 0 || slot >= MAX_EQUIPPED_BADGES) {
          throw new ValidationError(`Invalid slot: ${slot}. Must be between 0 and ${MAX_EQUIPPED_BADGES - 1}`);
        }
      }
      
      // Equip or unequip the badge
      return this.badgeRepository.toggleEquipBadge(userId, badgeId, equipped, slot);
    } catch (error) {
      logger.error('Error toggling equip badge', { userId, badgeId, request, error });
      throw error;
    }
  }

  /**
   * Check if a user has a specific badge
   * 
   * @param userId User ID
   * @param badgeId Badge ID
   * @returns True if user has the badge
   */
  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      return this.badgeRepository.userHasBadge(userId, badgeId);
    } catch (error) {
      logger.error('Error checking if user has badge', { userId, badgeId, error });
      throw error;
    }
  }

  /**
   * Get recommended badges for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of badges to return
   * @returns Array of recommended badges
   */
  async getRecommendedBadges(userId: string, limit: number = 3): Promise<Badge[]> {
    try {
      // Get all badges
      const allBadges = await this.badgeRepository.findAll();
      
      // Get user's badges
      const userBadges = await this.badgeRepository.getUserBadges(userId);
      const userBadgeIds = userBadges.map(ub => ub.badge.id);
      
      // Filter out badges user already has
      const availableBadges = allBadges.filter(badge => !userBadgeIds.includes(badge.id));
      
      // Sort by display priority (descending)
      availableBadges.sort((a, b) => b.display_priority - a.display_priority);
      
      // Return top badges
      return availableBadges.slice(0, limit);
    } catch (error) {
      logger.error('Error getting recommended badges', { userId, limit, error });
      throw error;
    }
  }

  /**
   * Get the total number of badges a user has
   * 
   * @param userId User ID
   * @returns Number of badges
   */
  async getUserBadgeCount(userId: string): Promise<number> {
    try {
      return this.badgeRepository.getUserBadgeCount(userId);
    } catch (error) {
      logger.error('Error counting user badges', { userId, error });
      throw error;
    }
  }
}
