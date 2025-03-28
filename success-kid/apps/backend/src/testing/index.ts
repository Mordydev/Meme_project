/**
 * Testing Module
 * 
 * Entry point for all testing utilities, factories, and mock data generators.
 */

// Export all sub-modules for easy access
export * from './mocks';
export * from './factories';
export * from './templates';
export * from './generators';

// Default export for convenient imports
export default {
  mocks: require('./mocks'),
  factories: require('./factories'),
  templates: require('./templates'),
  generators: require('./generators').default,
};
