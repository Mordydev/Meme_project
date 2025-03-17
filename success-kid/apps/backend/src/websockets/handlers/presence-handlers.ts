/**
 * WebSocket Handlers for Presence Events
 * 
 * Handles real-time updates for presence-related events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';
import { presenceService, PresenceStatus } from '../../presence';

/**
 * Register presence-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to clients
 */
export function registerPresenceHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle presence updated event
  eventBus.subscribe(EventType.PRESENCE_UPDATED, (data) => {
    try {
      const { userId, status, previousStatus, timestamp } = data;
      
      // Create presence update message
      const message = {
        type: 'presence.update',
        payload: {
          userId,
          status,
          previousStatus,
          timestamp
        }
      };
      
      // Broadcast to all users
      // Note: In a production system, you'd only broadcast to users who
      // are subscribed to this user's presence updates
      connectionRegistry.sendToAll(message.type, message.payload);
      
      logger.debug('Presence update notification sent', { 
        userId, 
        status, 
        previousStatus
      });
    } catch (error) {
      logger.error('Error sending presence update notification', { error });
    }
  });
  
  // Handle WebSocket connection (update presence)
  connectionRegistry.on('connection', (userId, metadata) => {
    // Update user presence when they connect
    presenceService.updatePresenceFromWebSocket(userId, metadata)
      .catch(error => {
        logger.error('Error updating presence on connection', { error, userId });
      });
  });
  
  // Handle WebSocket disconnection (update presence)
  connectionRegistry.on('disconnection', (userId, connectionCount) => {
    // If this was the last connection, update presence to offline
    if (connectionCount === 0) {
      presenceService.setUserOffline(userId)
        .catch(error => {
          logger.error('Error updating presence on disconnection', { error, userId });
        });
    }
  });
}
