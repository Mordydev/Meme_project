/**
 * WebSocket Handlers for Activity Events
 * 
 * Handles real-time updates for activity-related events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';

/**
 * Register activity-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to clients
 */
export function registerActivityHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle activity created event
  eventBus.subscribe(EventType.ACTIVITY_CREATED, (data) => {
    try {
      const { activityId, type, actorId, visibility } = data;
      
      // For public activities, broadcast to all
      if (visibility === 'public') {
        // Create activity message
        const message = {
          type: 'activity.created',
          payload: {
            id: activityId,
            activityType: type,
            actorId,
            timestamp: new Date().toISOString()
          }
        };
        
        // Broadcast to all users
        // Note: In a production system, you'd likely have a
        // more sophisticated approach to determine recipients
        connectionRegistry.sendToAll(message.type, message.payload);
        
        logger.debug('Activity created notification broadcast', { 
          activityId, 
          type
        });
      }
    } catch (error) {
      logger.error('Error sending activity created notification', { error });
    }
  });
  
  // Handle feed item created event
  eventBus.subscribe(EventType.FEED_ITEM_CREATED, (data) => {
    try {
      const { feedItemId, userId, activityId, activityType } = data;
      
      // Create feed message
      const message = {
        type: 'feed.item',
        payload: {
          id: feedItemId,
          activityId,
          activityType,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the target user
      connectionRegistry.sendToUser(userId, message.type, message.payload);
      
      logger.debug('Feed item notification sent', { 
        userId, 
        feedItemId, 
        activityId
      });
    } catch (error) {
      logger.error('Error sending feed item notification', { error });
    }
  });
  
  // Handle feed items read event
  eventBus.subscribe(EventType.FEED_ITEMS_READ, (data) => {
    try {
      const { userId, feedItemIds } = data;
      
      // Create feed read message
      const message = {
        type: 'feed.read',
        payload: {
          feedItemIds,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user's other connections
      connectionRegistry.sendToUser(userId, message.type, message.payload);
      
      logger.debug('Feed items read notification sent', { 
        userId, 
        count: feedItemIds.length
      });
    } catch (error) {
      logger.error('Error sending feed items read notification', { error });
    }
  });
}
