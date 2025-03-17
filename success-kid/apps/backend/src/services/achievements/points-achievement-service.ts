/**
 * Points Achievement Service
 * 
 * Integrates the points system with the achievement framework to trigger
 * achievements based on points milestones and patterns.
 */
import { logger } from '../../lib/logger';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { AchievementService } from './achievement-service';
import { eventBus, EventType } from '../../lib/event-bus';
import { PointsSource } from '../../models/user-points';
import { getRedisClient } from '../../lib/db-client';

interface PointsAchievementDefinition {
  id: string;
  name: string;
  description: string;
  type: 'total' | 'source' | 'streak' | 'pattern';
  threshold: number;
  source?: PointsSource;
  pointsReward?: number;
  icon?: string;
  rarity?: string;
}

/**
 * Service to track and award achievements based on points activity
 */
export class PointsAchievementService {
  private redis = getRedisClient();
  
  // Define point-based achievements
  private pointsAchievements: PointsAchievementDefinition[] = [
    // Total points achievements
    {
      id: 'points_1000',
      name: 'Point Collector',
      description: 'Earn 1,000 Success Points across all activities',
      type: 'total',
      threshold: 1000,
      pointsReward: 100,
      rarity: 'common'
    },
    {
      id: 'points_5000',
      name: 'Points Enthusiast',
      description: 'Earn 5,000 Success Points across all activities',
      type: 'total',
      threshold: 5000,
      pointsReward: 200,
      rarity: 'uncommon'
    },
    {
      id: 'points_10000',
      name: 'Points Master',
      description: 'Earn 10,000 Success Points across all activities',
      type: 'total',
      threshold: 10000,
      pointsReward: 300,
      rarity: 'rare'
    },
    {
      id: 'points_50000',
      name: 'Points Virtuoso',
      description: 'Earn 50,000 Success Points across all activities',
      type: 'total',
      threshold: 50000,
      pointsReward: 500,
      rarity: 'epic'
    },
    {
      id: 'points_100000',
      name: 'Points Legend',
      description: 'Earn 100,000 Success Points across all activities',
      type: 'total',
      threshold: 100000,
      pointsReward: 1000,
      rarity: 'legendary'
    },
    
    // Source-specific achievements
    {
      id: 'content_creator_1000',
      name: 'Content Creator',
      description: 'Earn 1,000 Success Points from creating content',
      type: 'source',
      source: 'content_creation',
      threshold: 1000,
      pointsReward: 150,
      rarity: 'uncommon'
    },
    {
      id: 'social_butterfly_1000',
      name: 'Social Butterfly',
      description: 'Earn 1,000 Success Points from commenting',
      type: 'source',
      source: 'comment',
      threshold: 1000,
      pointsReward: 150,
      rarity: 'uncommon'
    },
    {
      id: 'community_favorite_1000',
      name: 'Community Favorite',
      description: 'Earn 1,000 Success Points from upvotes received',
      type: 'source',
      source: 'upvote_received',
      threshold: 1000,
      pointsReward: 150,
      rarity: 'uncommon'
    },
    {
      id: 'referral_champion_1000',
      name: 'Referral Champion',
      description: 'Earn 1,000 Success Points from referrals',
      type: 'source',
      source: 'referral',
      threshold: 1000,
      pointsReward: 200,
      rarity: 'rare'
    },
    
    // Streak achievements
    {
      id: 'streak_7_days',
      name: 'Weekly Warrior',
      description: 'Earn streak bonus points for 7 consecutive days',
      type: 'streak',
      threshold: 7,
      pointsReward: 200,
      rarity: 'uncommon'
    },
    {
      id: 'streak_30_days',
      name: 'Monthly Master',
      description: 'Earn streak bonus points for 30 consecutive days',
      type: 'streak',
      threshold: 30,
      pointsReward: 500,
      rarity: 'rare'
    },
    
    // Pattern achievements
    {
      id: 'diverse_contributor',
      name: 'Diverse Contributor',
      description: 'Earn points from at least 5 different sources',
      type: 'pattern',
      threshold: 5,
      pointsReward: 250,
      rarity: 'rare'
    }
  ];
  
  constructor(
    private userPointsRepository: UserPointsRepository,
    private achievementService: AchievementService
  ) {
    // Set up event listeners for points events
    this.registerEventListeners();
  }
  
  /**
   * Set up event listeners for points events
   */
  private registerEventListeners() {
    // Listen for points awarded events
    eventBus.subscribe(EventType.POINTS_AWARDED, async (event) => {
      try {
        await this.checkAchievementsAfterPoints(
          event.userId,
          event.amount,
          event.source
        );
      } catch (error) {
        logger.error('Error checking achievements after points award', { 
          error, 
          userId: event.userId 
        });
      }
    });
  }
  
  /**
   * Check and award achievements after points are awarded
   * 
   * @param userId - User ID
   * @param amount - Points amount
   * @param source - Points source
   */
  async checkAchievementsAfterPoints(
    userId: string,
    amount: number,
    source: PointsSource
  ): Promise<void> {
    try {
      await Promise.all([
        this.checkTotalPointsAchievements(userId),
        this.checkSourceSpecificAchievements(userId, source),
        source === 'streak_bonus' ? this.checkStreakAchievements(userId) : Promise.resolve(),
        this.checkPatternAchievements(userId)
      ]);
    } catch (error) {
      logger.error('Error checking achievements', { error, userId, amount, source });
    }
  }
  
  /**
   * Check total points achievements
   * 
   * @param userId - User ID
   */
  private async checkTotalPointsAchievements(userId: string): Promise<void> {
    try {
      // Get user's current points total
      const totalPoints = await this.userPointsRepository.getUserPointsBalance(userId);
      
      // Get relevant achievements
      const totalPointsAchievements = this.pointsAchievements.filter(a => 
        a.type === 'total' && totalPoints >= a.threshold
      );
      
      // Award achievements that have been reached
      for (const achievement of totalPointsAchievements) {
        const alreadyAwarded = await this.achievementService.hasUnlockedAchievement(
          userId, 
          achievement.id
        );
        
        if (!alreadyAwarded) {
          await this.achievementService.awardAchievement(userId, achievement.id);
          
          // Award bonus points for the achievement if defined
          if (achievement.pointsReward) {
            await this.awardAchievementPoints(userId, achievement);
          }
          
          logger.info('Awarded points total achievement', {
            userId,
            achievementId: achievement.id,
            totalPoints
          });
        }
      }
    } catch (error) {
      logger.error('Error checking total points achievements', { error, userId });
    }
  }
  
  /**
   * Check source-specific achievements
   * 
   * @param userId - User ID
   * @param source - Points source
   */
  private async checkSourceSpecificAchievements(userId: string, source: PointsSource): Promise<void> {
    try {
      // Get points from this source
      const pointsFromSource = await this.userPointsRepository.getPointsBySource(userId, source);
      const totalFromSource = pointsFromSource.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Get relevant achievements
      const sourceAchievements = this.pointsAchievements.filter(a => 
        a.type === 'source' && a.source === source && totalFromSource >= a.threshold
      );
      
      // Award achievements that have been reached
      for (const achievement of sourceAchievements) {
        const alreadyAwarded = await this.achievementService.hasUnlockedAchievement(
          userId, 
          achievement.id
        );
        
        if (!alreadyAwarded) {
          await this.achievementService.awardAchievement(userId, achievement.id);
          
          // Award bonus points for the achievement if defined
          if (achievement.pointsReward) {
            await this.awardAchievementPoints(userId, achievement);
          }
          
          logger.info('Awarded source-specific achievement', {
            userId,
            achievementId: achievement.id,
            source,
            totalFromSource
          });
        }
      }
    } catch (error) {
      logger.error('Error checking source achievements', { error, userId, source });
    }
  }
  
  /**
   * Check streak-based achievements
   * 
   * @param userId - User ID
   */
  private async checkStreakAchievements(userId: string): Promise<void> {
    try {
      // This would need integration with a streak tracking service
      // For now, we'll use a simple implementation based on streak_bonus transactions
      
      // Get streak bonus transactions to calculate current streak
      const streakTransactions = await this.userPointsRepository.getPointsBySource(
        userId, 
        'streak_bonus'
      );
      
      // Sort by date descending (newest first)
      streakTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      if (streakTransactions.length === 0) {
        return; // No streak bonuses yet
      }
      
      // Calculate current streak by looking for consecutive days
      const dayMap = new Map<string, boolean>();
      
      for (const tx of streakTransactions) {
        const dateStr = new Date(tx.created_at).toISOString().split('T')[0];
        dayMap.set(dateStr, true);
      }
      
      // Convert to array of dates and sort
      const streakDays = Array.from(dayMap.keys()).sort();
      
      // Calculate longest continuous streak
      let currentStreak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < streakDays.length; i++) {
        const prevDate = new Date(streakDays[i - 1]);
        const currDate = new Date(streakDays[i]);
        
        // Check if dates are consecutive
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        
        maxStreak = Math.max(maxStreak, currentStreak);
      }
      
      // Get relevant achievements
      const streakAchievements = this.pointsAchievements.filter(a => 
        a.type === 'streak' && maxStreak >= a.threshold
      );
      
      // Award achievements that have been reached
      for (const achievement of streakAchievements) {
        const alreadyAwarded = await this.achievementService.hasUnlockedAchievement(
          userId, 
          achievement.id
        );
        
        if (!alreadyAwarded) {
          await this.achievementService.awardAchievement(userId, achievement.id);
          
          // Award bonus points for the achievement if defined
          if (achievement.pointsReward) {
            await this.awardAchievementPoints(userId, achievement);
          }
          
          logger.info('Awarded streak achievement', {
            userId,
            achievementId: achievement.id,
            streakDays: maxStreak
          });
        }
      }
    } catch (error) {
      logger.error('Error checking streak achievements', { error, userId });
    }
  }
  
  /**
   * Check pattern-based achievements
   * 
   * @param userId - User ID
   */
  private async checkPatternAchievements(userId: string): Promise<void> {
    try {
      // Check for diverse contributor achievement
      const diverseContributor = this.pointsAchievements.find(a => a.id === 'diverse_contributor');
      
      if (diverseContributor) {
        // Get all positive transactions grouped by source
        const allTransactions = await this.userPointsRepository.getUserPointsHistory(userId);
        
        // Count unique sources with positive points
        const sourceSet = new Set<string>();
        
        for (const tx of allTransactions) {
          if (tx.amount > 0) {
            sourceSet.add(tx.source);
          }
        }
        
        // Check if user has reached the threshold
        if (sourceSet.size >= diverseContributor.threshold) {
          const alreadyAwarded = await this.achievementService.hasUnlockedAchievement(
            userId, 
            diverseContributor.id
          );
          
          if (!alreadyAwarded) {
            await this.achievementService.awardAchievement(userId, diverseContributor.id);
            
            // Award bonus points for the achievement if defined
            if (diverseContributor.pointsReward) {
              await this.awardAchievementPoints(userId, diverseContributor);
            }
            
            logger.info('Awarded diverse contributor achievement', {
              userId,
              achievementId: diverseContributor.id,
              uniqueSources: sourceSet.size
            });
          }
        }
      }
      
      // Additional pattern achievements could be added here
    } catch (error) {
      logger.error('Error checking pattern achievements', { error, userId });
    }
  }
  
  /**
   * Award points for achievement completion
   * 
   * @param userId - User ID
   * @param achievement - Achievement definition
   */
  private async awardAchievementPoints(
    userId: string,
    achievement: PointsAchievementDefinition
  ): Promise<void> {
    try {
      if (!achievement.pointsReward || achievement.pointsReward <= 0) {
        return;
      }
      
      // Get points service to award points
      // Note: In a real implementation, you'd want to inject this dependency
      // For this example, we'll use the event bus to avoid circular dependencies
      eventBus.publish(EventType.AWARD_ACHIEVEMENT_POINTS, {
        userId,
        amount: achievement.pointsReward,
        source: 'achievement',
        referenceId: achievement.id,
        description: `Reward for achievement: ${achievement.name}`
      });
      
      logger.debug('Requested points award for achievement', {
        userId,
        achievementId: achievement.id,
        pointsAmount: achievement.pointsReward
      });
    } catch (error) {
      logger.error('Error awarding achievement points', { 
        error, 
        userId, 
        achievementId: achievement.id 
      });
    }
  }
  
  /**
   * Get achievement definitions
   * 
   * @returns Array of achievement definitions
   */
  getAchievementDefinitions(): PointsAchievementDefinition[] {
    return [...this.pointsAchievements];
  }
  
  /**
   * For development/testing: trigger achievement checks manually
   * 
   * @param userId - User ID to check achievements for
   */
  async triggerAchievementChecks(userId: string): Promise<{
    totalChecked: boolean;
    sourceChecked: boolean;
    streakChecked: boolean;
    patternChecked: boolean;
  }> {
    try {
      await Promise.all([
        this.checkTotalPointsAchievements(userId),
        this.checkSourceSpecificAchievements(userId, 'content_creation'),
        this.checkSourceSpecificAchievements(userId, 'comment'),
        this.checkSourceSpecificAchievements(userId, 'upvote_received'),
        this.checkSourceSpecificAchievements(userId, 'referral'),
        this.checkStreakAchievements(userId),
        this.checkPatternAchievements(userId)
      ]);
      
      return {
        totalChecked: true,
        sourceChecked: true,
        streakChecked: true,
        patternChecked: true
      };
    } catch (error) {
      logger.error('Error triggering achievement checks', { error, userId });
      throw error;
    }
  }
}
