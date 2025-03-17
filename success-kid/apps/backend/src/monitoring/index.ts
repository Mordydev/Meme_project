/**
 * Monitoring Module
 * 
 * Centralizes monitoring, metrics collection, and alerting functionality.
 */

// Export all sub-modules
export * from './metrics';
export * from './alerts';
export * from './health';
export * from './dashboards';

// Default export for convenient imports
export default {
  metrics: require('./metrics').default,
  alerts: require('./alerts').default,
  health: require('./health').default,
  dashboards: require('./dashboards').default,
};
