/**
 * WebSocket Events Initialization
 * 
 * Sets up event listeners for WebSocket notifications
 */
import { eventBus } from '../lib/event-bus';
import { connectionManager } from './connection-manager';
import { registerAllEventHandlers } from './handlers';

/**
 * Initialize WebSocket event handlers
 * 
 * Sets up listeners for events that should be pushed to clients via WebSockets
 */
export function initializeWebSocketEvents(): void {
  // Register all WebSocket event handlers
  registerAllEventHandlers(eventBus, connectionManager);
}

// Export for direct use
export default initializeWebSocketEvents;
