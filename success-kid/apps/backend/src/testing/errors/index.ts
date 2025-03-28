/**
 * Error Scenario Testing Framework
 * 
 * A system for systematically testing application behavior under error conditions.
 */

// Export all sub-modules
export * from './scenarios';
export * from './injection';
export * from './validation';

// Export error types
export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  PERMISSION_DENIED = 'permission_denied',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  DATABASE_ERROR = 'database_error',
  DEPENDENCY_FAILURE = 'dependency_failure'
}

// Default export for convenient imports
export default {
  scenarios: require('./scenarios'),
  injection: require('./injection').default,
  validation: require('./validation'),
};
