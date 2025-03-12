/**
 * Environment Configuration for Frontend
 * 
 * This module validates and provides type-safe access to environment variables.
 * It fails fast if required environment variables are missing.
 */

import { validateFrontendEnv, type FrontendEnv } from '@success-kid/env-schema';

/**
 * Extract public environment variables from process.env for client-side use
 */
const publicEnvVars = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
);

// Add NODE_ENV which is always available
const allEnvVars = {
  ...publicEnvVars,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

/**
 * Validate and provide type-safe access to environment variables
 */
function createEnv(): FrontendEnv {
  try {
    return validateFrontendEnv(allEnvVars);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.format());
    throw new Error('Invalid environment configuration. Please check your environment variables.');
  }
}

/**
 * Validated environment configuration
 */
export const env = createEnv();

/**
 * Export default validated environment
 */
export default env;
