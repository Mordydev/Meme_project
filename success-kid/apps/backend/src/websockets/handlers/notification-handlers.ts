/**
 * WebSocket Handlers for Notification Events
 * 
 * Handles real-time updates for notification-related events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';

/**
 * Register notification-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to clients
 */
export function registerNotificationHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle notification created event
  eventBus.subscribe(EventType.NOTIFICATION_CREATED, (data) => {
    try {
      const { notificationId, userId, type } = data;
      
      // Create notification message
      const message = {
        type: 'notification.created',
        payload: {
          id: notificationId,
          notificationType: type,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the target user
      connectionRegistry.sendToUser(userId, message.type, message.payload);
      
      logger.debug('Notification created notification sent', { 
        userId, 
        notificationId, 
        type
      });
    } catch (error) {
      logger.error('Error sending notification created notification', { error });
    }
  });
  
  // Handle notification delivered event
  eventBus.subscribe(EventType.NOTIFICATION_DELIVERED, (data) => {
    try {
      const { notificationId, userId, type, channels } = data;
      
      // Create notification message
      const message = {
        type: 'notification.delivered',
        payload: {
          id: notificationId,
          notificationType: type,
          channels,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the target user
      connectionRegistry.sendToUser(userId, message.type, message.payload);
      
      logger.debug('Notification delivered notification sent', { 
        userId, 
        notificationId, 
        type
      });
    } catch (error) {
      logger.error('Error sending notification delivered notification', { error });
    }
  });
  
  // Handle notification read event
  eventBus.subscribe(EventType.NOTIFICATION_READ, (data) => {
    try {
      const { notificationId, userId, type } = data;
      
      // Create notification message
      const message = {
        type: 'notification.read',
        payload: {
          id: notificationId,
          notificationType: type,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the target user's other connections
      connectionRegistry.sendToUser(userId, message.type, message.payload);
      
      logger.debug('Notification read notification sent', { 
        userId, 
        notificationId, 
        type
      });
    } catch (error) {
      logger.error('Error sending notification read notification', { error });
    }
  });
  
  // Handle notifications cleared event
  eventBus.subscribe(EventType.NOTIFICATIONS_CLEARED, (data) => {
    try {
      const { userId, count } = data;
      
      // Create notification message
      const message = {
        type: 'notifications.cleared',
        payload: {
          count,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the target user's other connections
      connectionRegistry.sendToUser(userId, message.type, message.payload);
      
      logger.debug('Notifications cleared notification sent', { 
        userId, 
        count
      });
    } catch (error) {
      logger.error('Error sending notifications cleared notification', { error });
    }
  });
}
