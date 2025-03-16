/**
 * Error module exports
 * 
 * This module centralizes access to all error-related functionality.
 */

// Re-export all error classes and utilities
export * from './base-error';
export * from './api-errors';
export * from './handlers';
export * from './serializers';

// Default export for convenient imports
export default {
  handleApiError: require('./handlers').handleApiError,
  handleWebSocketError: require('./handlers').handleWebSocketError
};
