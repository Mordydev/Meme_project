/**
 * WebSocket Handlers Module
 * 
 * Centralizes access to all WebSocket event handlers.
 */
import { EventBus } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { ConnectionManager } from '../connection-manager';
import { registerPointsEventHandlers } from './points-handlers';
import { registerNotificationHandlers } from './notification-handlers';
import { registerActivityHandlers } from './activity-handlers';
import { registerPresenceHandlers } from './presence-handlers';
import { registerRedemptionHandlers } from './redemption-handlers';
import { initializeForumHandlers } from './forum-handlers';
import { logger } from '../../lib/logger';
import { monitoringService } from '../../monitoring/service';

/**
 * Register all WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to clients
 * @param connectionManager Connection manager for message handlers
 */
export function registerAllEventHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry,
  connectionManager: ConnectionManager
): void {
  try {
    // Register points-related event handlers
    registerPointsEventHandlers(eventBus, connectionRegistry);
    
    // Register notification handlers
    registerNotificationHandlers(eventBus, connectionRegistry);
    
    // Register activity handlers
    registerActivityHandlers(eventBus, connectionRegistry);
    
    // Register presence handlers
    registerPresenceHandlers(eventBus, connectionRegistry);
    
    // Register forum handlers
    initializeForumHandlers(connectionManager);
    
    // Register redemption handlers (if available)
    try {
      registerRedemptionHandlers(eventBus, connectionRegistry);
    } catch (error) {
      // This module might not be available yet
      logger.warn('Redemption handlers not registered: Module may not be available', { error });
    }
    
    // Report successful handler registration
    monitoringService.recordMetric('websocket.handlers.registered', 1);
    
    logger.info('All WebSocket event handlers registered successfully');
  } catch (error) {
    logger.error('Failed to register WebSocket event handlers', { error });
    monitoringService.recordMetric('websocket.handlers.registration_failed', 1);
  }
}

// Export individual handler registration functions
export { 
  registerPointsEventHandlers,
  registerNotificationHandlers,
  registerActivityHandlers,
  registerPresenceHandlers,
  initializeForumHandlers
};
