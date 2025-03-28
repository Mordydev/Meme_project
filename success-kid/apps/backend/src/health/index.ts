/**
 * Health module exports
 * 
 * This module centralizes access to all health-related functionality.
 */

export * from './checks';
export * from './monitoring';

// Create a default export for convenient imports
export default {
  checks: require('./checks'),
  monitoring: require('./monitoring').default,
};
