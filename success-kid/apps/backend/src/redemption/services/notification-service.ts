/**
 * Redemption Notification Service
 * 
 * Handles notifications for redemption events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { WebSocketService } from '../../websockets/websocket-service';
import { logger } from '../../lib/logger';

/**
 * Service for handling notifications related to redemptions
 */
export class RedemptionNotificationService {
  /**
   * Create a new RedemptionNotificationService
   * 
   * @param eventBus Event bus for subscribing to events
   * @param websocketService WebSocket service for real-time notifications
   */
  constructor(
    private readonly eventBus: EventBus,
    private readonly websocketService: WebSocketService
  ) {
    this.setupEventSubscriptions();
  }

  /**
   * Set up event subscriptions
   */
  private setupEventSubscriptions(): void {
    // Subscribe to redemption events
    this.eventBus.subscribe(EventType.REDEMPTION_CREATED, this.handleRedemptionCreated.bind(this));
    this.eventBus.subscribe(EventType.REDEMPTION_PROCESSING, this.handleRedemptionProcessing.bind(this));
    this.eventBus.subscribe(EventType.REDEMPTION_COMPLETED, this.handleRedemptionCompleted.bind(this));
    this.eventBus.subscribe(EventType.REDEMPTION_FAILED, this.handleRedemptionFailed.bind(this));
    this.eventBus.subscribe(EventType.REDEMPTION_CANCELLED, this.handleRedemptionCancelled.bind(this));
    
    logger.info('Redemption notification subscriptions set up');
  }

  /**
   * Handle redemption created event
   * 
   * @param data Event data
   */
  private async handleRedemptionCreated(data: any): Promise<void> {
    try {
      const { userId, redemptionId, pointsAmount, tokenAmount, timestamp } = data;
      
      // Send real-time notification
      this.websocketService.sendToUser(userId, {
        type: 'redemption.created',
        data: {
          redemptionId,
          pointsAmount,
          tokenAmount,
          timestamp
        }
      });
      
      // In a real implementation, we would send other types of notifications
      // such as in-app notifications, emails, push notifications, etc.
      
      logger.info('Redemption created notification sent', { userId, redemptionId });
    } catch (error) {
      logger.error('Error sending redemption created notification', { data, error });
    }
  }

  /**
   * Handle redemption processing event
   * 
   * @param data Event data
   */
  private async handleRedemptionProcessing(data: any): Promise<void> {
    try {
      const { userId, redemptionId, transactionHash, timestamp } = data;
      
      // Send real-time notification
      this.websocketService.sendToUser(userId, {
        type: 'redemption.processing',
        data: {
          redemptionId,
          transactionHash,
          timestamp
        }
      });
      
      logger.info('Redemption processing notification sent', { userId, redemptionId });
    } catch (error) {
      logger.error('Error sending redemption processing notification', { data, error });
    }
  }

  /**
   * Handle redemption completed event
   * 
   * @param data Event data
   */
  private async handleRedemptionCompleted(data: any): Promise<void> {
    try {
      const { userId, redemptionId, transactionHash, pointsAmount, tokenAmount, timestamp } = data;
      
      // Send real-time notification
      this.websocketService.sendToUser(userId, {
        type: 'redemption.completed',
        data: {
          redemptionId,
          transactionHash,
          pointsAmount,
          tokenAmount,
          timestamp
        }
      });
      
      logger.info('Redemption completed notification sent', { userId, redemptionId });
    } catch (error) {
      logger.error('Error sending redemption completed notification', { data, error });
    }
  }

  /**
   * Handle redemption failed event
   * 
   * @param data Event data
   */
  private async handleRedemptionFailed(data: any): Promise<void> {
    try {
      const { userId, redemptionId, reason, timestamp } = data;
      
      // Send real-time notification
      this.websocketService.sendToUser(userId, {
        type: 'redemption.failed',
        data: {
          redemptionId,
          reason,
          timestamp
        }
      });
      
      logger.info('Redemption failed notification sent', { userId, redemptionId });
    } catch (error) {
      logger.error('Error sending redemption failed notification', { data, error });
    }
  }

  /**
   * Handle redemption cancelled event
   * 
   * @param data Event data
   */
  private async handleRedemptionCancelled(data: any): Promise<void> {
    try {
      const { userId, redemptionId, pointsAmount, tokenAmount, timestamp } = data;
      
      // Send real-time notification
      this.websocketService.sendToUser(userId, {
        type: 'redemption.cancelled',
        data: {
          redemptionId,
          pointsAmount,
          tokenAmount,
          timestamp
        }
      });
      
      logger.info('Redemption cancelled notification sent', { userId, redemptionId });
    } catch (error) {
      logger.error('Error sending redemption cancelled notification', { data, error });
    }
  }
}
