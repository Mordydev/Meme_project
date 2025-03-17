/**
 * WebSocket Module
 * 
 * This module centralizes access to all WebSocket functionality and initialization.
 * It provides a comprehensive real-time communication system with support for
 * authentication, error handling, event distribution, and performance optimization.
 */

// Core connection management
export * from './connection-registry';
export * from './connection-manager';
export * from './auth';
export * from './message-batcher';
export * from './recovery';
export * from './fallback';

// Event handlers
export * from './handlers';

// Event handlers for specific domains
export { registerPointsEventHandlers } from './handlers/points-handlers';
export { registerNotificationHandlers } from './handlers/notification-handlers';
export { registerActivityHandlers } from './handlers/activity-handlers';
export { registerPresenceHandlers } from './handlers/presence-handlers';
export { registerRedemptionHandlers } from './handlers/redemption-handlers';

/**
 * Initialize all WebSocket functionality
 * 
 * @param instance Fastify instance
 */
export async function initializeWebSocketSystem(instance: any): Promise<void> {
  // Import necessary modules
  const { eventBus } = await import('../lib/event-bus');
  const { connectionRegistry } = await import('./connection-registry');
  const { registerAllEventHandlers } = await import('./handlers');
  const { registerFallbackRoutes, initializeFallbackCleanup } = await import('./fallback');
  const { logger } = await import('../lib/logger');
  const { monitoringService } = await import('../monitoring/service');
  
  try {
    // Register all WebSocket event handlers
    registerAllEventHandlers(eventBus, connectionRegistry);
    
    // Register fallback routes
    await registerFallbackRoutes(instance);
    
    // Initialize fallback cleanup
    const cleanupFallback = initializeFallbackCleanup();
    
    // Add cleanup to server close hook
    instance.addHook('onClose', (instance: any, done: () => void) => {
      cleanupFallback();
      done();
    });
    
    // Set up periodic monitoring
    const monitoringInterval = setInterval(() => {
      try {
        // Report WebSocket metrics
        monitoringService.recordMetric(
          'websocket.connections.active',
          connectionRegistry.getConnectionCount(),
          {},
          'gauge'
        );
        
        monitoringService.recordMetric(
          'websocket.connections.users',
          connectionRegistry.getUserCount(),
          {},
          'gauge'
        );
      } catch (error) {
        logger.error('Error reporting WebSocket metrics', { error });
      }
    }, 60000); // Once per minute
    
    // Add monitoring cleanup to server close hook
    instance.addHook('onClose', (instance: any, done: () => void) => {
      clearInterval(monitoringInterval);
      done();
    });
    
    logger.info('WebSocket system initialized successfully');
    monitoringService.recordMetric('websocket.system.initialization', 1);
  } catch (error) {
    logger.error('Failed to initialize WebSocket system', { error });
    monitoringService.recordMetric('websocket.system.initialization_error', 1);
    throw error;
  }
}

// Export WebSocket plugin as default
export { default as webSocketPlugin } from './plugin';
