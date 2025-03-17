/**
 * Security module exports
 * 
 * This is the main entry point for all security-related functionality
 */

// Export framework
export * from './framework/service';
export * from './framework/policies';
export * from './framework/types';

// Export middleware
export * from './middleware';

// Export rate limiting
export * from './rate-limit';

// Export CSRF protection
export * from './csrf';

// Export encryption
export * from './encryption';

// Export PII handling
export * from './pii';

// Export vulnerability prevention
export * from './vulnerabilities';

// Export types
export * from './types';

// Default export for convenient imports
export default {
  SecurityService: require('./framework/service').SecurityService,
  createSecurityService: require('./framework/service').createSecurityService,
};
