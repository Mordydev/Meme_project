/**
 * Challenge Service
 * 
 * Service for managing challenges, user challenge participation, and progress tracking.
 */
import { logger } from '../../lib/logger';
import { EventBus } from '../../lib/event-bus';
import { ChallengeRepository } from '../../repositories/achievement/challenge-repository';
import { PointsService } from '../points/points-service';
import { BadgeService } from './badge-service';
import { LevelService } from './level-service';
import {
  Challenge,
  UserChallenge,
  UserChallengeProgress,
  ChallengeFilter,
  ChallengeRequirement,
  ChallengeReward,
  ChallengeProgressUpdate,
  ChallengeCompletion,
  ChallengeCompletedEvent,
  ActivityData
} from '../../models/entities/achievement/challenge.model';
import { NotFoundError, ValidationError } from '../../errors';

/**
 * Service for managing challenges
 */
export class ChallengeService {
  /**
   * Create a new ChallengeService
   * 
   * @param challengeRepository Repository for challenge data access
   * @param pointsService Service for awarding points
   * @param badgeService Service for awarding badges
   * @param levelService Service for awarding XP
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private challengeRepository: ChallengeRepository,
    private pointsService: PointsService,
    private badgeService: BadgeService,
    private levelService: LevelService,
    private eventBus: EventBus
  ) {
    // Schedule challenge status update job
    this.scheduleChallengeStatusUpdate();
  }

  /**
   * Schedule job to update challenge statuses
   */
  private scheduleChallengeStatusUpdate(): void {
    // Run every hour
    const updateInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    
    const updateChallengeStatuses = async () => {
      try {
        const updateCount = await this.challengeRepository.updateChallengeStatuses();
        if (updateCount > 0) {
          logger.info(`Updated ${updateCount} challenge statuses`);
        }
      } catch (error) {
        logger.error('Error updating challenge statuses', { error });
      }
      
      // Schedule next update
      setTimeout(updateChallengeStatuses, updateInterval);
    };
    
    // Schedule first update
    setTimeout(updateChallengeStatuses, 10000); // Start after 10 seconds
    
    logger.info(`Scheduled challenge status update job`);
  }

  /**
   * Get all challenges
   * 
   * @param filter Optional filter criteria
   * @returns Array of challenges
   */
  async getChallenges(filter?: ChallengeFilter): Promise<Challenge[]> {
    try {
      if (filter) {
        return this.challengeRepository.findByFilter(filter);
      } else {
        // Default to active and upcoming challenges
        return this.challengeRepository.findActiveChallenges(true);
      }
    } catch (error) {
      logger.error('Error getting challenges', { filter, error });
      throw error;
    }
  }

  /**
   * Get active challenges
   * 
   * @param includeUpcoming Whether to include upcoming challenges
   * @returns Array of active challenges
   */
  async getActiveChallenges(includeUpcoming: boolean = false): Promise<Challenge[]> {
    try {
      return this.challengeRepository.findActiveChallenges(includeUpcoming);
    } catch (error) {
      logger.error('Error getting active challenges', { includeUpcoming, error });
      throw error;
    }
  }

  /**
   * Get challenge by ID
   * 
   * @param id Challenge ID
   * @returns Challenge or null if not found
   */
  async getChallengeById(id: string): Promise<Challenge | null> {
    try {
      return this.challengeRepository.findById(id);
    } catch (error) {
      logger.error('Error getting challenge by ID', { id, error });
      throw error;
    }
  }

  /**
   * Create a new challenge
   * 
   * @param data Challenge data
   * @returns Created challenge
   */
  async createChallenge(
    data: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Challenge> {
    try {
      return this.challengeRepository.createChallenge(data);
    } catch (error) {
      logger.error('Error creating challenge', { data, error });
      throw error;
    }
  }

  /**
   * Get user's challenges
   * 
   * @param userId User ID
   * @param status Optional status filter
   * @returns Array of user challenges with challenge info
   */
  async getUserChallenges(
    userId: string,
    status?: 'active' | 'completed' | 'all'
  ): Promise<any[]> {
    try {
      return this.challengeRepository.getUserChallenges(userId, status);
    } catch (error) {
      logger.error('Error getting user challenges', { userId, status, error });
      throw error;
    }
  }

  /**
   * Join a challenge
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Joined user challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    try {
      // Check if challenge exists and is active
      const challenge = await this.challengeRepository.findById(challengeId);
      if (!challenge) {
        throw new NotFoundError('Challenge not found');
      }
      
      const now = new Date();
      if (challenge.start_date > now) {
        throw new ValidationError('Cannot join a challenge that has not started yet');
      }
      
      if (challenge.end_date <= now) {
        throw new ValidationError('Cannot join a challenge that has already ended');
      }
      
      // Join the challenge
      return this.challengeRepository.joinChallenge(userId, challengeId);
    } catch (error) {
      logger.error('Error joining challenge', { userId, challengeId, error });
      throw error;
    }
  }

  /**
   * Get user's progress for a challenge
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Array of progress items for each requirement
   */
  async getChallengeProgress(
    userId: string,
    challengeId: string
  ): Promise<UserChallengeProgress[]> {
    try {
      return this.challengeRepository.getUserChallengeProgress(userId, challengeId);
    } catch (error) {
      logger.error('Error getting challenge progress', { userId, challengeId, error });
      throw error;
    }
  }

  /**
   * Update user's progress for a challenge
   * 
   * @param userId User ID
   * @param activityData Activity data that might affect challenge progress
   * @returns Challenge progress update info
   */
  async updateChallengeProgress(
    userId: string,
    activityData: ActivityData
  ): Promise<ChallengeProgressUpdate> {
    try {
      // Get user's active challenges
      const userChallenges = await this.challengeRepository.getUserChallenges(userId, 'active');
      
      if (userChallenges.length === 0) {
        return { updated: false };
      }
      
      const result: ChallengeProgressUpdate = {
        updated: false,
        progressed: [],
        completed: []
      };
      
      // Process each challenge
      for (const userChallenge of userChallenges) {
        const challenge = userChallenge.challenge;
        
        // Process each requirement in the challenge
        const progressUpdates: any[] = [];
        
        for (const requirement of challenge.requirements) {
          // Check if this activity contributes to the requirement
          const progress = await this.processActivityForRequirement(
            userId,
            challenge.id,
            requirement,
            activityData
          );
          
          if (progress) {
            progressUpdates.push({
              requirementId: requirement.id,
              currentValue: progress.current_value,
              targetValue: progress.target_value
            });
          }
        }
        
        if (progressUpdates.length > 0) {
          result.updated = true;
          
          // Add to progressed challenges
          result.progressed.push({
            challengeId: challenge.id,
            requirements: progressUpdates
          });
          
          // Check if challenge is now complete
          const isComplete = await this.challengeRepository.isChallengeCompleted(userId, challenge.id);
          
          if (isComplete) {
            // Complete the challenge
            const completion = await this.challengeRepository.completeChallenge(userId, challenge.id);
            
            // Process rewards
            const transactionIds = await this.processRewards(userId, completion);
            
            // Add to completed challenges
            result.completed.push({
              challengeId: challenge.id,
              rewards: challenge.rewards
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error updating challenge progress', { userId, activityData, error });
      return { updated: false };
    }
  }

  /**
   * Process activity data for a challenge requirement
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @param requirement Challenge requirement
   * @param activityData Activity data
   * @returns Updated progress or null if no update
   */
  private async processActivityForRequirement(
    userId: string,
    challengeId: string,
    requirement: ChallengeRequirement,
    activityData: ActivityData
  ): Promise<UserChallengeProgress | null> {
    try {
      // Check if this activity applies to this requirement
      let newValue: number | null = null;
      
      switch (requirement.type) {
        case 'content_creation':
          if (activityData.activityType === 'content_creation') {
            // Check content type if specified
            if (requirement.metadata?.contentType && 
                activityData.metadata?.contentType !== requirement.metadata.contentType) {
              return null;
            }
            
            // Increment count
            newValue = 1;
          }
          break;
          
        case 'login':
          if (activityData.activityType === 'login') {
            newValue = 1;
          }
          break;
          
        case 'engagement':
          if (activityData.activityType === 'engagement' ||
              activityData.activityType === 'comment' ||
              activityData.activityType === 'reaction') {
            newValue = 1;
          }
          break;
          
        // Handle other requirement types
        default:
          // For other types, use custom query if provided
          if (requirement.metadata?.query) {
            // Execute custom query to get current value
            // This would be implemented to safely execute predefined queries
          }
          break;
      }
      
      if (newValue === null) {
        return null; // No update needed
      }
      
      // Get current progress
      const currentProgress = await this.challengeRepository.getUserChallengeProgress(
        userId, 
        challengeId
      );
      
      // Find progress for this requirement
      const requirementProgress = currentProgress.find(p => p.requirement_id === requirement.id);
      
      if (requirementProgress) {
        // Increment existing progress
        const updatedValue = requirementProgress.current_value + newValue;
        
        // Update progress
        return this.challengeRepository.updateChallengeProgress(
          userId,
          challengeId,
          requirement.id,
          updatedValue
        );
      } else {
        // Create new progress
        return this.challengeRepository.updateChallengeProgress(
          userId,
          challengeId,
          requirement.id,
          newValue
        );
      }
    } catch (error) {
      logger.error('Error processing activity for requirement', { 
        userId, challengeId, requirement, activityData, error 
      });
      return null;
    }
  }

  /**
   * Process rewards for a completed challenge
   * 
   * @param userId User ID
   * @param completion Challenge completion data
   * @returns Array of transaction IDs
   */
  private async processRewards(
    userId: string,
    completion: ChallengeCompletion
  ): Promise<string[]> {
    try {
      const transactionIds: string[] = [];
      
      // Get challenge for reward data
      const challenge = await this.challengeRepository.findById(completion.challengeId);
      if (!challenge) {
        logger.error('Challenge not found for reward processing', { completion });
        return transactionIds;
      }
      
      // Process each reward
      for (const reward of challenge.rewards) {
        try {
          switch (reward.type) {
            case 'points':
              // Award points
              const pointsResult = await this.pointsService.awardPoints({
                userId,
                amount: reward.value,
                source: 'challenge_completion',
                referenceId: completion.challengeId,
                description: `Challenge: ${challenge.title}`
              });
              
              if (pointsResult.success) {
                transactionIds.push(pointsResult.transactionId || '');
              }
              break;
              
            case 'badge':
              // Award badge
              if (reward.metadata?.badgeId) {
                try {
                  await this.badgeService.awardBadge({
                    userId,
                    badgeId: reward.metadata.badgeId,
                    source: 'challenge_completion',
                    reason: `Challenge: ${challenge.title}`
                  });
                } catch (error) {
                  logger.warn('Failed to award badge for challenge', { 
                    userId, challengeId: completion.challengeId, badgeId: reward.metadata.badgeId, error 
                  });
                }
              }
              break;
              
            case 'xp':
              // Award XP
              await this.levelService.addXP({
                userId,
                amount: reward.value,
                source: 'challenge_completion',
                referenceId: completion.challengeId,
                metadata: { challengeTitle: challenge.title }
              });
              break;
              
            case 'custom':
              // Handle custom rewards
              logger.info('Custom reward processing', { 
                userId, challengeId: completion.challengeId, reward 
              });
              break;
          }
        } catch (error) {
          logger.error('Error processing challenge reward', { 
            userId, challengeId: completion.challengeId, reward, error 
          });
        }
      }
      
      // Emit challenge completed event
      const completedEvent: ChallengeCompletedEvent = {
        userId,
        challengeId: completion.challengeId,
        challenge: {
          title: challenge.title,
          category: challenge.category,
          difficulty: challenge.difficulty
        },
        rewards: challenge.rewards,
        completedAt: completion.completedAt
      };
      
      await this.eventBus.publish('challenge.completed', completedEvent);
      
      return transactionIds;
    } catch (error) {
      logger.error('Error processing challenge rewards', { userId, completion, error });
      return [];
    }
  }

  /**
   * Check if a challenge is completed
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns True if challenge is completed
   */
  async isChallengeCompleted(userId: string, challengeId: string): Promise<boolean> {
    try {
      return this.challengeRepository.isChallengeCompleted(userId, challengeId);
    } catch (error) {
      logger.error('Error checking if challenge is completed', { userId, challengeId, error });
      throw error;
    }
  }

  /**
   * Complete a challenge manually
   * 
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Challenge completion data
   */
  async completeChallenge(userId: string, challengeId: string): Promise<ChallengeCompletion> {
    try {
      // Check if challenge is actually complete
      const isComplete = await this.challengeRepository.isChallengeCompleted(userId, challengeId);
      if (!isComplete) {
        throw new ValidationError('Challenge requirements not complete');
      }
      
      // Complete the challenge
      const completion = await this.challengeRepository.completeChallenge(userId, challengeId);
      
      // Process rewards
      const transactionIds = await this.processRewards(userId, completion);
      
      return {
        ...completion,
        transactionIds
      };
    } catch (error) {
      logger.error('Error completing challenge', { userId, challengeId, error });
      throw error;
    }
  }
}
