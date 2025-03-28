/**
 * WebSocket Handlers for Presence Events
 * 
 * Handles real-time delivery of user presence updates via WebSockets.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';
import { PresenceStatus } from '../../presence/service';
import { registerMessageForFallback } from '../fallback';
import { monitoringService } from '../../monitoring/service';

// Cache of users subscribed to presence updates
// userId -> Set of userIds they're subscribed to
const presenceSubscriptions = new Map<string, Set<string>>();

/**
 * Register presence-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to connected clients
 */
export function registerPresenceHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle presence updated event
  eventBus.subscribe(EventType.PRESENCE_UPDATED, (data) => {
    try {
      const { userId, status, previousStatus, timestamp } = data;
      
      // Skip updates for offline users going offline again
      if (status === PresenceStatus.OFFLINE && previousStatus === PresenceStatus.OFFLINE) {
        return;
      }
      
      // Create presence message
      const message = {
        type: 'presence.update',
        payload: {
          userId,
          status,
          timestamp: timestamp || new Date().toISOString()
        }
      };
      
      // Find all users subscribed to this user's presence
      const subscriberIds = findPresenceSubscribers(userId);
      
      // Send to each subscriber
      for (const subscriberId of subscriberIds) {
        connectionRegistry.sendToUser(subscriberId, message, {
          priority: 'low' // Presence is usually lower priority
        });
      }
      
      // Track metrics
      if (status === PresenceStatus.ONLINE && previousStatus !== PresenceStatus.ONLINE) {
        monitoringService.recordMetric('presence.online', 1);
      } else if (status === PresenceStatus.OFFLINE && previousStatus !== PresenceStatus.OFFLINE) {
        monitoringService.recordMetric('presence.offline', 1);
      }
      
      // If user went online, notify all their connections of any subscriptions
      if (status === PresenceStatus.ONLINE && previousStatus !== PresenceStatus.ONLINE) {
        sendSubscriptionStateUpdate(userId, connectionRegistry);
      }
      
      logger.debug('Presence update delivered', { 
        userId, 
        status, 
        subscriberCount: subscriberIds.size 
      });
    } catch (error) {
      logger.error('Error delivering presence update', { error, data });
    }
  });
  
  // Handle presence subscription
  eventBus.subscribe(EventType.PRESENCE_SUBSCRIBED, (data) => {
    try {
      const { subscriberId, targetIds } = data;
      
      if (!subscriberId || !targetIds || !Array.isArray(targetIds)) {
        return;
      }
      
      // Update subscriptions
      let subscriberSubs = presenceSubscriptions.get(subscriberId);
      if (!subscriberSubs) {
        subscriberSubs = new Set();
        presenceSubscriptions.set(subscriberId, subscriberSubs);
      }
      
      // Add new subscriptions
      targetIds.forEach(targetId => {
        if (targetId) subscriberSubs!.add(targetId);
      });
      
      // Send confirmation
      const message = {
        type: 'presence.subscribed',
        payload: {
          targetIds,
          timestamp: new Date().toISOString()
        }
      };
      
      connectionRegistry.sendToUser(subscriberId, message, {
        priority: 'normal'
      });
      
      // Register for fallback delivery
      registerMessageForFallback(subscriberId, message.type, message.payload);
      
      // Send initial presence for targets
      sendInitialPresence(subscriberId, targetIds, connectionRegistry);
      
      logger.debug('Presence subscription updated', { 
        subscriberId, 
        targetCount: targetIds.length 
      });
    } catch (error) {
      logger.error('Error handling presence subscription', { error, data });
    }
  });
  
  // Handle the "get presence" message via WebSocket
  eventBus.subscribe('presence.get', (data) => {
    try {
      const { userId, targetIds } = data;
      
      if (!userId || !targetIds || !Array.isArray(targetIds)) {
        return;
      }
      
      // Send presence for requested targets
      sendInitialPresence(userId, targetIds, connectionRegistry);
      
      logger.debug('Presence info sent in response to get request', { 
        userId, 
        targetCount: targetIds.length 
      });
    } catch (error) {
      logger.error('Error handling presence get request', { error, data });
    }
  });
}

/**
 * Find all users subscribed to a user's presence
 * 
 * @param userId User ID to find subscribers for
 * @returns Set of subscriber user IDs
 */
function findPresenceSubscribers(userId: string): Set<string> {
  const subscribers = new Set<string>();
  
  for (const [subscriberId, targetIds] of presenceSubscriptions.entries()) {
    if (targetIds.has(userId)) {
      subscribers.add(subscriberId);
    }
  }
  
  return subscribers;
}

/**
 * Send initial presence for multiple users
 * 
 * @param userId User ID requesting presence
 * @param targetIds Target user IDs to get presence for
 * @param connectionRegistry Connection registry
 */
async function sendInitialPresence(
  userId: string,
  targetIds: string[],
  connectionRegistry: ConnectionRegistry
): Promise<void> {
  try {
    // Get presence service
    const { presenceService } = await import('../../presence/service');
    
    // Get presence for all targets
    const presenceData = await presenceService.getUsersPresence(targetIds);
    
    // Format for client
    const presenceList = Array.from(presenceData.entries()).map(([id, data]) => ({
      userId: id,
      status: data.status,
      lastActive: data.lastActive.toISOString(),
      customStatus: data.customStatus
    }));
    
    // Send to user
    const message = {
      type: 'presence.initial',
      payload: {
        presence: presenceList,
        timestamp: new Date().toISOString()
      }
    };
    
    connectionRegistry.sendToUser(userId, message, {
      priority: 'normal'
    });
    
    // Register for fallback delivery
    registerMessageForFallback(userId, message.type, message.payload);
  } catch (error) {
    logger.error('Error sending initial presence', { error, userId, targetCount: targetIds.length });
  }
}

/**
 * Send subscription state update to a user
 * 
 * @param userId User ID to send to
 * @param connectionRegistry Connection registry
 */
function sendSubscriptionStateUpdate(
  userId: string,
  connectionRegistry: ConnectionRegistry
): void {
  try {
    const subscriptions = presenceSubscriptions.get(userId);
    
    if (!subscriptions || subscriptions.size === 0) {
      return;
    }
    
    // Send subscription state
    const message = {
      type: 'presence.subscriptions',
      payload: {
        targetIds: Array.from(subscriptions),
        timestamp: new Date().toISOString()
      }
    };
    
    connectionRegistry.sendToUser(userId, message, {
      priority: 'low'
    });
  } catch (error) {
    logger.error('Error sending subscription state update', { error, userId });
  }
}

/**
 * Update presence subscriptions directly (e.g., from WebSocket message)
 * 
 * @param userId User ID subscribing
 * @param targetIds Target user IDs to subscribe to
 * @param operation 'add' or 'remove'
 */
export function updatePresenceSubscriptions(
  userId: string,
  targetIds: string[],
  operation: 'add' | 'remove'
): void {
  try {
    if (!userId || !targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return;
    }
    
    // Get or initialize subscription set
    let subscriptions = presenceSubscriptions.get(userId);
    
    if (!subscriptions) {
      subscriptions = new Set();
      presenceSubscriptions.set(userId, subscriptions);
    }
    
    // Update subscriptions based on operation
    if (operation === 'add') {
      targetIds.forEach(id => subscriptions!.add(id));
    } else {
      targetIds.forEach(id => subscriptions!.delete(id));
    }
    
    // Remove entry if no subscriptions left
    if (subscriptions.size === 0) {
      presenceSubscriptions.delete(userId);
    }
    
    // Emit event for other servers in the cluster
    import('../../lib/event-bus').then(({ eventBus }) => {
      eventBus.publish(EventType.PRESENCE_SUBSCRIBED, {
        subscriberId: userId,
        targetIds,
        operation
      });
    });
    
    logger.debug('Presence subscriptions updated directly', { 
      userId, 
      targetCount: targetIds.length, 
      operation 
    });
  } catch (error) {
    logger.error('Error updating presence subscriptions directly', { 
      error, 
      userId, 
      targetCount: targetIds.length 
    });
  }
}

/**
 * Get presence subscriptions for a user
 * 
 * @param userId User ID
 * @returns Array of target user IDs
 */
export function getPresenceSubscriptions(userId: string): string[] {
  const subscriptions = presenceSubscriptions.get(userId);
  
  if (!subscriptions) {
    return [];
  }
  
  return Array.from(subscriptions);
}

/**
 * Clean up presence subscriptions for a user
 * 
 * @param userId User ID
 */
export function cleanupPresenceSubscriptions(userId: string): void {
  presenceSubscriptions.delete(userId);
}
