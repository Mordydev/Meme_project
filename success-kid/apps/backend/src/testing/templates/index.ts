/**
 * Templates Module
 * 
 * Provides predefined templates for test data generation.
 */

// Export all sub-modules
export * from './users';
export * from './content';

// Default export for convenient imports
export default {
  users: require('./users').default,
  content: require('./content').default,
};
