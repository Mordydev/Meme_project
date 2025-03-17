/**
 * WebSocket Handlers for Redemption Events
 * 
 * Handles real-time notifications for token redemption events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';
import { registerMessageForFallback } from '../fallback';
import { monitoringService } from '../../monitoring/service';

/**
 * Register redemption-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to connected clients
 */
export function registerRedemptionHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle redemption requested event
  eventBus.subscribe(EventType.REDEMPTION_REQUESTED, (data) => {
    try {
      const { userId, transactionId, pointsAmount, tokenAmount } = data;
      
      // Create notification message
      const message = {
        type: 'redemption.requested',
        payload: {
          transactionId,
          pointsAmount,
          tokenAmount,
          status: 'processing',
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: false // Redemption confirmation should be immediate
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track metrics
      monitoringService.recordMetric('redemption.requested.notifications', 1);
      
      logger.debug('Redemption requested notification sent', { 
        userId, 
        transactionId,
        pointsAmount
      });
    } catch (error) {
      logger.error('Error sending redemption requested notification', { error, data });
    }
  });
  
  // Handle redemption processing event
  eventBus.subscribe(EventType.REDEMPTION_PROCESSING, (data) => {
    try {
      const { userId, transactionId, pointsAmount, tokenAmount, progress } = data;
      
      // Create notification message
      const message = {
        type: 'redemption.processing',
        payload: {
          transactionId,
          pointsAmount,
          tokenAmount,
          progress: progress || 0,
          status: 'processing',
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with normal priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'normal'
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      logger.debug('Redemption processing notification sent', { 
        userId, 
        transactionId,
        progress
      });
    } catch (error) {
      logger.error('Error sending redemption processing notification', { error, data });
    }
  });
  
  // Handle redemption completed event
  eventBus.subscribe(EventType.REDEMPTION_COMPLETED, (data) => {
    try {
      const { userId, transactionId, pointsAmount, tokenAmount, transactionHash } = data;
      
      // Create notification message
      const message = {
        type: 'redemption.completed',
        payload: {
          transactionId,
          pointsAmount,
          tokenAmount,
          transactionHash,
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: false // Completion notification should be immediate
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track metrics
      monitoringService.recordMetric('redemption.completed.notifications', 1);
      
      logger.debug('Redemption completed notification sent', { 
        userId, 
        transactionId,
        pointsAmount,
        transactionHash
      });
    } catch (error) {
      logger.error('Error sending redemption completed notification', { error, data });
    }
  });
  
  // Handle redemption failed event
  eventBus.subscribe(EventType.REDEMPTION_FAILED, (data) => {
    try {
      const { userId, transactionId, pointsAmount, tokenAmount, reason } = data;
      
      // Create notification message
      const message = {
        type: 'redemption.failed',
        payload: {
          transactionId,
          pointsAmount,
          tokenAmount,
          reason: reason || 'Unknown error occurred',
          status: 'failed',
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: false // Failure notification should be immediate
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track metrics
      monitoringService.recordMetric('redemption.failed.notifications', 1);
      
      logger.debug('Redemption failed notification sent', { 
        userId, 
        transactionId,
        reason
      });
    } catch (error) {
      logger.error('Error sending redemption failed notification', { error, data });
    }
  });
}
