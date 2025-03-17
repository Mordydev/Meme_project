/**
 * API Schema Definitions
 * 
 * This module exports all API schema definitions for OpenAPI documentation.
 */

// Import all schema definitions
import errorSchemas from './error';
import userSchemas from './users';
import pointsSchemas from './points';
import contentSchemas from './content';
import marketSchemas from './market';
import walletSchemas from './wallet';
import standardResponseSchemas from './responses';

// Re-export all schemas
export {
  errorSchemas,
  userSchemas,
  pointsSchemas,
  contentSchemas,
  marketSchemas,
  walletSchemas,
  standardResponseSchemas
};

// Create schema registry for runtime schema validation
export const schemaRegistry = {
  error: errorSchemas,
  user: userSchemas,
  points: pointsSchemas,
  content: contentSchemas,
  market: marketSchemas,
  wallet: walletSchemas,
  responses: standardResponseSchemas
};

export default schemaRegistry;
