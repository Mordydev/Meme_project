/**
 * Challenge Service
 * 
 * Manages time-limited challenges for user engagement
 */
import { Pool } from 'pg';
import { Challenge, ChallengeDifficulty, ChallengeStatus } from '../../models/challenge';
import { UserChallenge } from '../../models/user-challenge';
import { ChallengeRepository } from '../../repositories/challenge-repository';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsService } from '../points';
import { NotificationService } from '../notifications';
import { BadgeService } from '../badges';

export interface ActivityData {
  userId: string;
  type: string;
  activityId?: string;
  metadata?: Record<string, any>;
}

export interface ChallengeProgressUpdate {
  updated: boolean;
  progressed: {
    challengeId: string;
    requirements: {
      requirementId: string;
      currentValue: number;
      targetValue: number;
    }[];
  }[];
  completed: {
    challengeId: string;
    rewards: {
      type: string;
      value: any;
    }[];
  }[];
}

export interface ChallengeCompletion {
  challengeId: string;
  userId: string;
  completedAt: Date;
  rewards: {
    type: string;
    value: any;
    processed: boolean;
  }[];
}

export interface ChallengeFilter {
  status?: ChallengeStatus;
  difficulty?: ChallengeDifficulty;
  category?: string;
  search?: string;
}

export class ChallengeService {
  private repository: ChallengeRepository;
  private pointsService: PointsService;
  private badgeService: BadgeService;
  private eventBus: EventBus;
  private notificationService: NotificationService;
  
  constructor(
    db: Pool,
    repository: ChallengeRepository,
    pointsService: PointsService,
    badgeService: BadgeService,
    eventBus: EventBus,
    notificationService: NotificationService
  ) {
    this.repository = repository;
    this.pointsService = pointsService;
    this.badgeService = badgeService;
    this.eventBus = eventBus;
    this.notificationService = notificationService;
  }
  
  /**
   * Get active challenges
   */
  async getActiveChallenges(filter?: ChallengeFilter): Promise<Challenge[]> {
    try {
      return this.repository.getActiveChallenges(filter);
    } catch (error) {
      logger.error('Error getting active challenges', { error, filter });
      throw error;
    }
  }
  
  /**
   * Get a specific challenge by ID
   */
  async getChallenge(id: string): Promise<Challenge | null> {
    try {
      return this.repository.findById(id);
    } catch (error) {
      logger.error('Error getting challenge', { error, id });
      throw error;
    }
  }
  
  /**
   * Get user's challenges
   */
  async getUserChallenges(
    userId: string,
    statusFilter?: ChallengeStatus
  ): Promise<(UserChallenge & Challenge)[]> {
    try {
      return this.repository.getUserChallenges(userId, statusFilter);
    } catch (error) {
      logger.error('Error getting user challenges', { error, userId, statusFilter });
      throw error;
    }
  }
  
  /**
   * Join a challenge
   */
  async joinChallenge(
    userId: string, 
    challengeId: string
  ): Promise<UserChallenge> {
    try {
      // Check if challenge exists and is active
      const challenge = await this.repository.findById(challengeId);
      
      if (!challenge) {
        throw new Error(`Challenge not found with ID ${challengeId}`);
      }
      
      if (challenge.status !== ChallengeStatus.ACTIVE) {
        throw new Error(`Challenge is not active: ${challenge.status}`);
      }
      
      // Check if user already joined
      const existingUserChallenge = await this.repository.getUserChallenge(userId, challengeId);
      
      if (existingUserChallenge) {
        logger.info('User already joined this challenge', { userId, challengeId });
        return existingUserChallenge;
      }
      
      logger.info('User joining challenge', { userId, challengeId });
      
      // Create user challenge record
      const userChallenge = await this.repository.createUserChallenge({
        user_id: userId,
        challenge_id: challengeId,
        joined_at: new Date(),
        status: ChallengeStatus.IN_PROGRESS
      });
      
      // Initialize progress for each requirement
      await Promise.all(
        challenge.requirements.map(req => 
          this.repository.initializeRequirementProgress(userId, challengeId, req.id)
        )
      );
      
      // Send notification
      await this.notificationService.createNotification({
        userId,
        type: 'challenge_joined',
        title: 'Challenge Joined',
        message: `You've joined the "${challenge.title}" challenge`,
        data: {
          challengeId: challenge.id,
          title: challenge.title,
          endDate: challenge.end_date
        }
      });
      
      // Emit event
      this.eventBus.publish('challenge:joined', {
        userId,
        challengeId,
        title: challenge.title,
        joinedAt: userChallenge.joined_at
      });
      
      return userChallenge;
    } catch (error) {
      logger.error('Error joining challenge', { error, userId, challengeId });
      throw error;
    }
  }
  
  /**
   * Update challenge progress based on activity
   */
  async updateChallengeProgress(activityData: ActivityData): Promise<ChallengeProgressUpdate> {
    const { userId, type: activityType } = activityData;
    
    try {
      // Get user's active challenges
      const userChallenges = await this.repository.getUserChallenges(
        userId,
        ChallengeStatus.IN_PROGRESS
      );
      
      if (userChallenges.length === 0) {
        return { updated: false, progressed: [], completed: [] };
      }
      
      const result: ChallengeProgressUpdate = {
        updated: false,
        progressed: [],
        completed: []
      };
      
      // Process each challenge
      for (const userChallenge of userChallenges) {
        // Skip if challenge is not active anymore
        if (userChallenge.status !== ChallengeStatus.ACTIVE) {
          continue;
        }
        
        // Check if activity contributes to challenge
        const progressUpdates = await this.processActivityForChallenge(
          userChallenge,
          activityType,
          activityData
        );
        
        if (progressUpdates.length > 0) {
          result.updated = true;
          
          const challengeProgress = {
            challengeId: userChallenge.challenge_id,
            requirements: progressUpdates.map(p => ({
              requirementId: p.requirementId,
              currentValue: p.currentValue,
              targetValue: p.targetValue
            }))
          };
          
          result.progressed.push(challengeProgress);
          
          // Check if challenge is completed
          const isCompleted = await this.checkChallengeCompletion(
            userId,
            userChallenge.challenge_id
          );
          
          if (isCompleted) {
            const challenge = await this.repository.findById(userChallenge.challenge_id);
            
            if (challenge) {
              result.completed.push({
                challengeId: challenge.id,
                rewards: challenge.rewards
              });
              
              // Process rewards
              await this.completeChallengeWithRewards(userId, challenge);
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error updating challenge progress', { error, activityData });
      throw error;
    }
  }
  
  /**
   * Process activity for a specific challenge
   */
  private async processActivityForChallenge(
    userChallenge: UserChallenge & Challenge,
    activityType: string,
    activityData: ActivityData
  ): Promise<{
    requirementId: string;
    currentValue: number;
    targetValue: number;
  }[]> {
    try {
      const progressUpdates: {
        requirementId: string;
        currentValue: number;
        targetValue: number;
      }[] = [];
      
      // Get matching requirements for this activity type
      const matchingRequirements = userChallenge.requirements.filter(
        req => req.activity_type === activityType
      );
      
      for (const requirement of matchingRequirements) {
        // Get current progress
        const progress = await this.repository.getRequirementProgress(
          activityData.userId,
          userChallenge.id,
          requirement.id
        );
        
        if (!progress) continue;
        
        // Check if requirement matches specific criteria
        const matches = this.requirementMatchesActivity(requirement, activityData);
        
        if (matches) {
          // Increment progress
          const increment = requirement.increment_by || 1;
          const newValue = progress.current_value + increment;
          
          // Update progress
          await this.repository.updateRequirementProgress(
            activityData.userId,
            userChallenge.id,
            requirement.id,
            newValue
          );
          
          progressUpdates.push({
            requirementId: requirement.id,
            currentValue: newValue,
            targetValue: requirement.target_value
          });
        }
      }
      
      return progressUpdates;
    } catch (error) {
      logger.error('Error processing activity for challenge', { 
        error, 
        challengeId: userChallenge.id, 
        activityType 
      });
      return [];
    }
  }
  
  /**
   * Check if a requirement matches the activity
   */
  private requirementMatchesActivity(
    requirement: any, 
    activityData: ActivityData
  ): boolean {
    try {
      // Basic match on activity type
      if (requirement.activity_type !== activityData.type) {
        return false;
      }
      
      // Check for specific conditions if present
      if (requirement.conditions && Object.keys(requirement.conditions).length > 0) {
        for (const [key, value] of Object.entries(requirement.conditions)) {
          // Check if the condition key exists in the metadata
          if (!activityData.metadata || activityData.metadata[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking if requirement matches activity', { 
        error, 
        requirement, 
        activityData 
      });
      return false;
    }
  }
  
  /**
   * Check if a challenge is completed
   */
  async checkChallengeCompletion(
    userId: string,
    challengeId: string
  ): Promise<boolean> {
    try {
      // Get challenge
      const challenge = await this.repository.findById(challengeId);
      
      if (!challenge || !challenge.requirements || challenge.requirements.length === 0) {
        return false;
      }
      
      // Get progress for all requirements
      const allProgress = await this.repository.getAllRequirementsProgress(
        userId,
        challengeId
      );
      
      // Check if all requirements are completed
      const allCompleted = challenge.requirements.every(req => {
        const progress = allProgress.find(p => p.requirement_id === req.id);
        return progress && progress.current_value >= req.target_value;
      });
      
      return allCompleted;
    } catch (error) {
      logger.error('Error checking challenge completion', { 
        error, 
        userId, 
        challengeId 
      });
      return false;
    }
  }
  
  /**
   * Complete a challenge and award rewards
   */
  private async completeChallengeWithRewards(
    userId: string,
    challenge: Challenge
  ): Promise<void> {
    try {
      logger.info('Completing challenge with rewards', { userId, challengeId: challenge.id });
      
      // Update user challenge to completed
      await this.repository.updateUserChallengeStatus(
        userId,
        challenge.id,
        ChallengeStatus.COMPLETED
      );
      
      // Process each reward
      for (const reward of challenge.rewards) {
        switch (reward.type) {
          case 'points':
            await this.pointsService.awardPoints({
              userId,
              amount: reward.value,
              source: 'challenge_completion',
              referenceId: challenge.id,
              description: `Challenge Completed: ${challenge.title}`
            });
            break;
            
          case 'badge':
            await this.badgeService.awardBadge({
              userId,
              badgeId: reward.value,
              source: 'challenge_completion',
              referenceId: challenge.id
            });
            break;
            
          // Add more reward types as needed
            
          default:
            logger.warn('Unknown reward type', { 
              type: reward.type, 
              challengeId: challenge.id 
            });
        }
      }
      
      // Send notification
      await this.notificationService.createNotification({
        userId,
        type: 'challenge_completed',
        title: 'Challenge Completed!',
        message: `You've completed the "${challenge.title}" challenge`,
        data: {
          challengeId: challenge.id,
          title: challenge.title,
          rewards: challenge.rewards
        }
      });
      
      // Emit challenge completed event
      this.eventBus.publish('challenge:completed', {
        userId,
        challengeId: challenge.id,
        title: challenge.title,
        rewards: challenge.rewards,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error completing challenge with rewards', { 
        error, 
        userId, 
        challengeId: challenge.id 
      });
      throw error;
    }
  }
  
  /**
   * Get challenge completion details
   */
  async getChallengeCompletion(
    userId: string,
    challengeId: string
  ): Promise<ChallengeCompletion | null> {
    try {
      const userChallenge = await this.repository.getUserChallenge(userId, challengeId);
      
      if (!userChallenge || userChallenge.status !== ChallengeStatus.COMPLETED) {
        return null;
      }
      
      const challenge = await this.repository.findById(challengeId);
      
      if (!challenge) {
        return null;
      }
      
      // Get reward processing status
      const rewardStatus = await this.repository.getChallengeRewardStatus(userId, challengeId);
      
      return {
        challengeId,
        userId,
        completedAt: userChallenge.completed_at!,
        rewards: challenge.rewards.map(reward => ({
          type: reward.type,
          value: reward.value,
          processed: rewardStatus[reward.type] || false
        }))
      };
    } catch (error) {
      logger.error('Error getting challenge completion', { error, userId, challengeId });
      throw error;
    }
  }
  
  /**
   * Get active challenges recommended for a user
   */
  async getRecommendedChallenges(
    userId: string,
    limit: number = 3
  ): Promise<Challenge[]> {
    try {
      return this.repository.getRecommendedChallenges(userId, limit);
    } catch (error) {
      logger.error('Error getting recommended challenges', { error, userId, limit });
      throw error;
    }
  }
  
  /**
   * Update challenge statuses based on dates (scheduled job)
   */
  async updateChallengeStatuses(): Promise<{
    started: number;
    completed: number;
    expired: number;
  }> {
    try {
      logger.info('Updating challenge statuses');
      
      const now = new Date();
      
      // Start challenges whose start date has arrived
      const startedCount = await this.repository.updateChallengeStatusByDate(
        ChallengeStatus.SCHEDULED,
        ChallengeStatus.ACTIVE,
        'start_date',
        now,
        '<='
      );
      
      // Complete challenges whose end date has passed
      const completedCount = await this.repository.updateChallengeStatusByDate(
        ChallengeStatus.ACTIVE,
        ChallengeStatus.COMPLETED,
        'end_date',
        now,
        '<'
      );
      
      // Notify users of newly completed challenges
      await this.notifyUsersOfCompletedChallenges();
      
      // Expire in-progress user challenges for completed challenges
      const expiredCount = await this.repository.expireUserChallenges();
      
      logger.info('Challenge status updates completed', { 
        startedCount, 
        completedCount,
        expiredCount
      });
      
      return {
        started: startedCount,
        completed: completedCount,
        expired: expiredCount
      };
    } catch (error) {
      logger.error('Error updating challenge statuses', { error });
      throw error;
    }
  }
  
  /**
   * Notify users of newly completed challenges
   */
  private async notifyUsersOfCompletedChallenges(): Promise<void> {
    try {
      // Get newly completed challenges
      const recentlyCompletedChallenges = await this.repository.getRecentlyCompletedChallenges();
      
      for (const challenge of recentlyCompletedChallenges) {
        // Get all users who joined this challenge
        const participants = await this.repository.getChallengeParticipants(challenge.id);
        
        // Notify each participant
        for (const userId of participants) {
          await this.notificationService.createNotification({
            userId,
            type: 'challenge_ended',
            title: 'Challenge Ended',
            message: `The "${challenge.title}" challenge has ended.`,
            data: {
              challengeId: challenge.id,
              title: challenge.title,
              status: challenge.status
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error notifying users of completed challenges', { error });
    }
  }
}
