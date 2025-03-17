/**
 * WebSocket Handlers for Notification Events
 * 
 * Handles real-time delivery of notifications via WebSockets.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';
import { registerMessageForFallback } from '../fallback';
import { messageBatcher } from '../message-batcher';
import { monitoringService } from '../../monitoring/service';

/**
 * Register notification-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to connected clients
 */
export function registerNotificationHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle notification created event
  eventBus.subscribe(EventType.NOTIFICATION_CREATED, (data) => {
    try {
      const { notificationId, userId, type, notification } = data;
      
      // Early return if required data is missing
      if (!userId || !notificationId) {
        logger.warn('Incomplete notification data', { data });
        return;
      }
      
      // Format notification for the client
      const clientNotification = {
        id: notificationId,
        type,
        ...notification,
      };
      
      // Create notification message
      const message = {
        type: 'notification.new',
        payload: {
          notification: clientNotification,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: false // Send immediately
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track delivery attempt
      monitoringService.recordMetric('notifications.delivery_attempts', 1, { channel: 'websocket' });
      
      logger.debug('Notification sent via WebSocket', { 
        userId, 
        notificationId,
        type 
      });
    } catch (error) {
      logger.error('Error sending notification via WebSocket', { error, data });
    }
  });
  
  // Handle notification delivered event
  eventBus.subscribe(EventType.NOTIFICATION_DELIVERED, (data) => {
    try {
      const { notificationId, userId, type, channels } = data;
      
      // Skip if not delivered via WebSocket
      if (!channels.includes('inapp')) {
        return;
      }
      
      // Send confirmation message
      const message = {
        type: 'notification.delivered',
        payload: {
          notificationId,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to user with normal priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'normal'
      });
      
      logger.debug('Notification delivery confirmed via WebSocket', { 
        userId, 
        notificationId 
      });
    } catch (error) {
      logger.error('Error confirming notification delivery', { error, data });
    }
  });
  
  // Handle notification read event
  eventBus.subscribe(EventType.NOTIFICATION_READ, (data) => {
    try {
      const { notificationId, userId, type } = data;
      
      // Create message
      const message = {
        type: 'notification.read',
        payload: {
          notificationId,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to all user's connections to sync across devices
      connectionRegistry.sendToUser(userId, message, {
        priority: 'normal'
      });
      
      // Register for fallback delivery to ensure cross-device sync
      registerMessageForFallback(userId, message.type, message.payload);
      
      logger.debug('Notification read status synced via WebSocket', { 
        userId, 
        notificationId 
      });
    } catch (error) {
      logger.error('Error syncing notification read status', { error, data });
    }
  });
  
  // Handle notifications cleared event
  eventBus.subscribe(EventType.NOTIFICATIONS_CLEARED, (data) => {
    try {
      const { userId, count } = data;
      
      // Create message
      const message = {
        type: 'notifications.cleared',
        payload: {
          count,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to all user's connections to sync across devices
      connectionRegistry.sendToUser(userId, message, {
        priority: 'normal'
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      logger.debug('Notifications cleared status synced via WebSocket', { 
        userId, 
        count 
      });
    } catch (error) {
      logger.error('Error syncing notifications cleared status', { error, data });
    }
  });
  
  // Handle bulk notification delivery for performance optimization
  eventBus.subscribe('notifications.bulk_delivery', (data) => {
    try {
      const { notifications, userId } = data;
      
      if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
        return;
      }
      
      // Don't use batching for bulk notifications, send as a single batch directly
      const message = {
        type: 'notifications.batch',
        payload: {
          notifications: notifications.map(n => ({
            id: n.id,
            type: n.type,
            ...n.data
          })),
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to user
      connectionRegistry.sendToUser(userId, message, {
        priority: 'normal',
        batchingEnabled: false // Already batched
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track delivery metrics
      monitoringService.recordMetric('notifications.batch_delivery', notifications.length);
      
      logger.debug('Bulk notifications sent via WebSocket', { 
        userId, 
        count: notifications.length 
      });
    } catch (error) {
      logger.error('Error sending bulk notifications', { error, data });
    }
  });
}

/**
 * Format notification for client consumption
 * 
 * @param notification Notification data from database
 * @returns Client-friendly notification
 */
function formatNotificationForClient(notification: any): any {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    createdAt: notification.created_at,
    readAt: notification.read_at,
    category: notification.category
  };
}
