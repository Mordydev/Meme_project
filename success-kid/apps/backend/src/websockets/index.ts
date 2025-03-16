/**
 * WebSocket module exports
 * 
 * This module centralizes access to all WebSocket functionality.
 */

export * from './connection-manager';
export * from './auth';
export * from './handlers';
export * from './events';

// Export event initialization function
export { default as initializeWebSocketEvents } from './events';

// Export websocket plugin as default
export { default } from './plugin';
