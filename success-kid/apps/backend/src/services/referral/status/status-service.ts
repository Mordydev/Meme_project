/**
 * Referral Status Service
 * 
 * Service for tracking referral status and sending notifications
 */
import { 
  ReferralRepository,
  ReferralCodeRepository
} from '../../../repositories/referral';
import { ReferralStatus } from '../../../models/entities/referral.model';
import { NotificationService } from '../../notification/notification-service';
import { EventBus } from '../../../lib/event-bus';
import { logger } from '../../../lib/logger';
import { NotFoundError } from '../../../errors';

/**
 * Status summary
 */
export interface StatusSummary {
  totalReferrals: number;
  referralsByStatus: Record<ReferralStatus, number>;
  pendingMilestones: {
    milestone: string;
    refereeCount: number;
    potentialRewards: number;
  }[];
  recentStatusChanges: StatusChange[];
}

/**
 * Status change
 */
export interface StatusChange {
  referralId: string;
  refereeId: string;
  oldStatus: ReferralStatus;
  newStatus: ReferralStatus;
  changedAt: Date;
}

/**
 * Progress update
 */
export interface ProgressUpdate {
  referralId: string;
  oldStatus: ReferralStatus;
  newStatus: ReferralStatus;
  statusChanged: boolean;
  progress: {
    hasWallet: boolean;
    pointsEarned: number;
    achievements?: number;
    contentCreated?: number;
  };
}

/**
 * Notification type
 */
export type NotificationType = 
  | 'referral_created'
  | 'status_changed'
  | 'milestone_achieved'
  | 'reward_earned'
  | 'wallet_connected';

/**
 * Notification result
 */
export interface NotificationResult {
  sent: boolean;
  channels: string[];
  error?: string;
}

/**
 * Service for managing referral status
 */
export class ReferralStatusService {
  /**
   * Create a new ReferralStatusService instance
   */
  constructor(
    private referralRepository: ReferralRepository,
    private notificationService: NotificationService,
    private eventBus: EventBus
  ) {}

  /**
   * Get status summary for a user
   * 
   * @param userId User ID
   * @returns Status summary
   */
  async getStatusSummary(userId: string): Promise<StatusSummary> {
    try {
      // Get user's referral stats
      const stats = await this.referralRepository.getReferralStats(userId);
      
      // Get status-specific counts
      const referralsByStatus: Record<ReferralStatus, number> = {
        'pending': stats.pending,
        'completed': stats.completed,
        'converted': stats.converted,
        'rewarded': stats.rewarded,
        'expired': stats.expired,
        'invalid': stats.invalid
      };
      
      // Get pending milestones
      const pendingMilestones = await this.getPendingMilestones(userId);
      
      // Get recent status changes
      const recentChanges = await this.getRecentStatusChanges(userId);
      
      return {
        totalReferrals: stats.total,
        referralsByStatus,
        pendingMilestones,
        recentStatusChanges: recentChanges
      };
    } catch (error) {
      logger.error('Failed to get status summary', { userId, error });
      throw error;
    }
  }

  /**
   * Update referral status
   * 
   * @param referralId Referral ID
   * @param status New status
   * @returns Status update result
   */
  async updateReferralStatus(
    referralId: string,
    status: ReferralStatus
  ): Promise<StatusUpdateResult> {
    try {
      // Get the current referral
      const referral = await this.referralRepository.findById(referralId);
      if (!referral) {
        throw new NotFoundError('Referral', referralId);
      }
      
      // If status is already the same, return early
      if (referral.status === status) {
        return {
          success: true,
          statusChanged: false,
          oldStatus: referral.status,
          newStatus: status
        };
      }
      
      // Update the status
      const updatedReferral = await this.referralRepository.updateStatus(referralId, status);
      
      // Record the status change
      await this.recordStatusChange(
        referralId,
        referral.referrer_id,
        referral.referred_id,
        referral.status,
        status
      );
      
      // Send notifications
      await this.sendStatusNotification(
        referral.referrer_id,
        'status_changed',
        {
          referralId,
          refereeId: referral.referred_id,
          oldStatus: referral.status,
          newStatus: status
        }
      );
      
      // Emit event
      await this.eventBus.publish('referral.status_updated', {
        referralId,
        referrerId: referral.referrer_id,
        refereeId: referral.referred_id,
        oldStatus: referral.status,
        newStatus: status
      });
      
      logger.info(`Referral status updated: ${referralId} ${referral.status} -> ${status}`);
      
      return {
        success: true,
        statusChanged: true,
        oldStatus: referral.status,
        newStatus: status
      };
    } catch (error) {
      logger.error('Failed to update referral status', { referralId, status, error });
      
      return {
        success: false,
        statusChanged: false,
        error: error.message
      };
    }
  }

  /**
   * Track referee progress
   * 
   * @param refereeId Referee user ID
   * @returns Progress update
   */
  async trackRefereeProgress(refereeId: string): Promise<ProgressUpdate> {
    try {
      // Get the referral
      const referral = await this.referralRepository.findByReferredId(refereeId);
      if (!referral) {
        throw new NotFoundError(`No referral found for user ${refereeId}`);
      }
      
      // Get current status
      const currentStatus = referral.status;
      
      // Check for status updates
      let newStatus = currentStatus;
      let statusChanged = false;
      
      // Check if user has connected wallet
      const hasWallet = await this.userHasConnectedWallet(refereeId);
      
      // Check if user has earned points
      const pointsEarned = await this.getUserPointsEarned(refereeId);
      
      // Check if user has created content
      const contentCreated = await this.getUserContentCount(refereeId);
      
      // Check if user has earned achievements
      const achievements = await this.getUserAchievementCount(refereeId);
      
      // Determine new status based on progress
      if (currentStatus === 'pending' && hasWallet) {
        newStatus = 'converted';
        statusChanged = true;
      } else if (currentStatus === 'pending' && pointsEarned >= 500) {
        newStatus = 'completed';
        statusChanged = true;
      } else if (currentStatus === 'completed' && hasWallet) {
        newStatus = 'converted';
        statusChanged = true;
      }
      
      // Update status if changed
      if (statusChanged) {
        await this.updateReferralStatus(referral.id, newStatus);
        
        // Send notification to referrer
        await this.sendStatusNotification(
          referral.referrer_id,
          'status_changed',
          {
            referralId: referral.id,
            refereeId,
            oldStatus: currentStatus,
            newStatus
          }
        );
      }
      
      return {
        referralId: referral.id,
        oldStatus: currentStatus,
        newStatus,
        statusChanged,
        progress: {
          hasWallet,
          pointsEarned,
          contentCreated,
          achievements
        }
      };
    } catch (error) {
      logger.error('Failed to track referee progress', { refereeId, error });
      throw error;
    }
  }

  /**
   * Send status notification
   * 
   * @param userId User ID to notify
   * @param type Notification type
   * @param data Notification data
   * @returns Notification result
   */
  async sendStatusNotification(
    userId: string,
    type: NotificationType,
    data: any
  ): Promise<NotificationResult> {
    try {
      // Determine notification details based on type
      let title = '';
      let message = '';
      let action = '';
      let actionUrl = '';
      
      switch (type) {
        case 'referral_created':
          title = 'New Referral';
          message = `You've successfully referred a new user!`;
          action = 'View Referrals';
          actionUrl = '/referrals/mine';
          break;
          
        case 'status_changed':
          title = 'Referral Status Updated';
          message = `A referral has changed from ${data.oldStatus} to ${data.newStatus}`;
          action = 'View Details';
          actionUrl = '/referrals/mine';
          break;
          
        case 'milestone_achieved':
          title = 'Milestone Achieved';
          message = `Your referred user has reached the ${data.milestone} milestone`;
          action = 'View Details';
          actionUrl = '/referrals/mine';
          break;
          
        case 'reward_earned':
          title = 'Referral Reward Earned';
          message = `You've earned ${data.amount} points from your referral`;
          action = 'View Rewards';
          actionUrl = '/rewards';
          break;
          
        case 'wallet_connected':
          title = 'Wallet Connected';
          message = 'Your referred user has connected their wallet';
          action = 'View Referrals';
          actionUrl = '/referrals/mine';
          break;
      }
      
      // Send notification
      const result = await this.notificationService.sendNotification({
        userId,
        title,
        message,
        type: 'referral',
        action,
        actionUrl,
        data
      });
      
      return {
        sent: result.success,
        channels: result.channels || [],
        error: result.error
      };
    } catch (error) {
      logger.error('Failed to send status notification', { userId, type, error });
      
      return {
        sent: false,
        channels: [],
        error: error.message
      };
    }
  }

  /**
   * Process scheduled status updates
   * 
   * @returns Processing results
   */
  async processScheduledStatusUpdates(): Promise<{
    processed: number;
    updated: number;
    failed: number;
  }> {
    try {
      const results = {
        processed: 0,
        updated: 0,
        failed: 0
      };
      
      // Process expiring pending referrals
      const expiredResults = await this.processExpiringReferrals();
      
      results.processed += expiredResults.processed;
      results.updated += expiredResults.updated;
      results.failed += expiredResults.failed;
      
      // Processing other scheduled updates would go here
      
      return results;
    } catch (error) {
      logger.error('Failed to process scheduled status updates', { error });
      
      return {
        processed: 0,
        updated: 0,
        failed: 1
      };
    }
  }

  /**
   * Process expiring referrals
   * 
   * @returns Processing results
   */
  private async processExpiringReferrals(): Promise<{
    processed: number;
    updated: number;
    failed: number;
  }> {
    try {
      const results = {
        processed: 0,
        updated: 0,
        failed: 0
      };
      
      // Get referrals that are still pending after 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // In a real implementation, this would use a more efficient query
      // For now, we'll get all pending referrals and filter
      const pendingReferrals = await this.referralRepository.findByStatus('pending', 1000, 0);
      
      // Filter for referrals older than 7 days
      const expiringReferrals = pendingReferrals.filter(r => 
        r.created_at < sevenDaysAgo
      );
      
      results.processed = expiringReferrals.length;
      
      // Update each to expired
      for (const referral of expiringReferrals) {
        try {
          await this.updateReferralStatus(referral.id, 'expired');
          results.updated++;
        } catch (error) {
          results.failed++;
          logger.error('Failed to expire referral', { referralId: referral.id, error });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to process expiring referrals', { error });
      
      return {
        processed: 0,
        updated: 0,
        failed: 1
      };
    }
  }

  /**
   * Get pending milestones
   * 
   * @param userId User ID
   * @returns Pending milestones
   */
  private async getPendingMilestones(
    userId: string
  ): Promise<{
    milestone: string;
    refereeCount: number;
    potentialRewards: number;
  }[]> {
    try {
      // This would query for referred users who are close to milestones
      // For now, we'll return sample data
      
      return [
        {
          milestone: 'wallet_connection',
          refereeCount: 3,
          potentialRewards: 750 // 3 users * 250 points
        },
        {
          milestone: 'content_creation',
          refereeCount: 5,
          potentialRewards: 500 // 5 users * 100 points
        },
        {
          milestone: 'points_1000',
          refereeCount: 2,
          potentialRewards: 200 // 2 users * 100 points
        }
      ];
    } catch (error) {
      logger.error('Failed to get pending milestones', { userId, error });
      return [];
    }
  }

  /**
   * Get recent status changes
   * 
   * @param userId User ID
   * @param limit Maximum number of changes to return
   * @returns Recent status changes
   */
  private async getRecentStatusChanges(
    userId: string,
    limit: number = 5
  ): Promise<StatusChange[]> {
    try {
      // This would query a status change log table
      // For now, we'll return sample data
      
      // Get user's referrals
      const referrals = await this.referralRepository.findByReferrerId(userId, limit, 0);
      
      // Create sample status changes
      return referrals.map(referral => ({
        referralId: referral.id,
        refereeId: referral.referred_id,
        oldStatus: 'pending',
        newStatus: referral.status,
        changedAt: new Date(referral.created_at.getTime() + 86400000) // 1 day after creation
      }));
    } catch (error) {
      logger.error('Failed to get recent status changes', { userId, limit, error });
      return [];
    }
  }

  /**
   * Record a status change
   * 
   * @param referralId Referral ID
   * @param referrerId Referrer user ID
   * @param refereeId Referee user ID
   * @param oldStatus Old status
   * @param newStatus New status
   */
  private async recordStatusChange(
    referralId: string,
    referrerId: string,
    refereeId: string,
    oldStatus: ReferralStatus,
    newStatus: ReferralStatus
  ): Promise<void> {
    try {
      // In a real implementation, this would be stored in a database table
      // For now, we'll just log it
      logger.info(`Status change: ${referralId} ${oldStatus} -> ${newStatus}`, {
        referralId,
        referrerId,
        refereeId,
        oldStatus,
        newStatus
      });
    } catch (error) {
      logger.error('Failed to record status change', {
        referralId,
        referrerId,
        refereeId,
        oldStatus,
        newStatus,
        error
      });
    }
  }

  /**
   * Check if user has connected wallet
   * 
   * @param userId User ID
   * @returns Whether user has connected wallet
   */
  private async userHasConnectedWallet(userId: string): Promise<boolean> {
    // In a real implementation, this would check the user's wallet connections
    // For now, we'll return random true/false
    return Math.random() > 0.5;
  }

  /**
   * Get user's points earned
   * 
   * @param userId User ID
   * @returns Points earned
   */
  private async getUserPointsEarned(userId: string): Promise<number> {
    // In a real implementation, this would query the points service
    // For now, we'll return a random value
    return Math.floor(Math.random() * 2000);
  }

  /**
   * Get user's content count
   * 
   * @param userId User ID
   * @returns Content count
   */
  private async getUserContentCount(userId: string): Promise<number> {
    // In a real implementation, this would query the content service
    // For now, we'll return a random value
    return Math.floor(Math.random() * 10);
  }

  /**
   * Get user's achievement count
   * 
   * @param userId User ID
   * @returns Achievement count
   */
  private async getUserAchievementCount(userId: string): Promise<number> {
    // In a real implementation, this would query the achievement service
    // For now, we'll return a random value
    return Math.floor(Math.random() * 5);
  }
}

/**
 * Status update result
 */
export interface StatusUpdateResult {
  success: boolean;
  statusChanged?: boolean;
  oldStatus?: ReferralStatus;
  newStatus?: ReferralStatus;
  error?: string;
}
