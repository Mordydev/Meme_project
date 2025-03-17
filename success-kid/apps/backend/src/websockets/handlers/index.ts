/**
 * WebSocket Handlers Module
 * 
 * Centralizes access to all WebSocket event handlers.
 */
import { EventBus } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { registerPointsEventHandlers } from './points-handlers';
import { registerNotificationHandlers } from './notification-handlers';
import { registerActivityHandlers } from './activity-handlers';
import { registerPresenceHandlers } from './presence-handlers';

/**
 * Register all WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to clients
 */
export function registerAllEventHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Register points-related event handlers
  registerPointsEventHandlers(eventBus, connectionRegistry);
  
  // Register notification handlers
  registerNotificationHandlers(eventBus, connectionRegistry);
  
  // Register activity handlers
  registerActivityHandlers(eventBus, connectionRegistry);
  
  // Register presence handlers
  registerPresenceHandlers(eventBus, connectionRegistry);
  
  // Register other event handlers as they're implemented
  // registerContentEventHandlers(eventBus, connectionRegistry);
  // registerMarketEventHandlers(eventBus, connectionRegistry);
}

// Export individual handler registration functions
export { 
  registerPointsEventHandlers,
  registerNotificationHandlers,
  registerActivityHandlers,
  registerPresenceHandlers
};
