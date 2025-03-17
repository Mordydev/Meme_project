/**
 * In-App Notification Channel
 * 
 * Handles delivering notifications within the application.
 */
import { connectionManager } from '../../websockets/connection-manager';
import { logger } from '../../lib/logger';
import { Notification, DeliveryResult } from '../models';

/**
 * In-app notification channel class
 */
export class InAppChannel {
  /**
   * Send an in-app notification to a user
   * 
   * @param userId User ID to send notification to
   * @param content Rendered notification content
   * @param notification Original notification object
   * @returns Delivery result
   */
  async send(
    userId: string,
    content: { title: string; body: string; data?: any },
    notification: Notification
  ): Promise<DeliveryResult> {
    try {
      // Check if user is online
      const isOnline = connectionManager.isUserOnline(userId);
      
      // Prepare notification message
      const message = {
        type: 'notification',
        payload: {
          id: notification.id,
          title: content.title,
          body: content.body,
          imageUrl: notification.image_url,
          data: content.data || notification.data,
          notificationType: notification.type,
          category: notification.category,
          importance: notification.importance,
          timestamp: new Date().toISOString(),
          actions: this.getActionsForNotificationType(notification.type, notification.data)
        }
      };
      
      // Send to active connections if user is online
      if (isOnline) {
        connectionManager.sendToUser(userId, message.type, message.payload);
        
        logger.debug('In-app notification sent', { 
          userId, 
          notificationId: notification.id,
          sentToActiveConnections: true
        });
      } else {
        logger.debug('In-app notification queued (user offline)', { 
          userId, 
          notificationId: notification.id 
        });
      }
      
      // Always return success since in-app notifications are stored in the database
      // and will be shown when user connects or checks their notifications
      return {
        channel: 'inapp',
        success: true,
        messageId: notification.id,
        timestamp: new Date(),
        retryCount: 0
      };
    } catch (error) {
      logger.error('Failed to send in-app notification', { 
        error, 
        userId, 
        notificationId: notification.id 
      });
      
      return {
        channel: 'inapp',
        success: false,
        timestamp: new Date(),
        error: error.message || 'Failed to send in-app notification',
        retryCount: 0
      };
    }
  }

  /**
   * Get available actions for notification type
   * 
   * @param notificationType Type of notification
   * @param data Additional notification data
   * @returns Actions for the notification
   */
  private getActionsForNotificationType(
    notificationType: string,
    data: Record<string, any> = {}
  ): Array<{ label: string; action: string; url?: string }> {
    switch (notificationType) {
      case 'points.awarded':
        return [{ label: 'View Points', action: 'navigate', url: '/profile/points' }];
      
      case 'achievement.unlocked':
        return [{ label: 'View Achievement', action: 'navigate', url: `/achievements/${data.achievementId}` }];
      
      case 'content.commented':
        return [{ label: 'View Comment', action: 'navigate', url: `/content/${data.contentId}#comment-${data.commentId}` }];
      
      case 'content.reaction':
        return [{ label: 'View Content', action: 'navigate', url: `/content/${data.contentId}` }];
      
      case 'milestone.reached':
        return [{ label: 'View Market', action: 'navigate', url: '/market' }];
      
      case 'wallet.connected':
        return [{ label: 'View Wallet', action: 'navigate', url: '/profile/wallet' }];
        
      case 'referral.attributed':
        return [{ label: 'View Referrals', action: 'navigate', url: '/profile/referrals' }];
      
      default:
        return [];
    }
  }
}

// Export singleton instance
export const inAppChannel = new InAppChannel();
