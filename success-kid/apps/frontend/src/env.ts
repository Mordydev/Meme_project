/**
 * Environment Configuration for Frontend
 * 
 * This module provides access to environment variables with fallbacks.
 */

// Try importing the schema package, but don't fail if not available
let envSchemaModule: any;
try {
  envSchemaModule = require('@success-kid/env-schema');
} catch (error) {
  console.warn('⚠️ @success-kid/env-schema not found, using fallback validation');
  envSchemaModule = null;
}

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
 * Frontend environment type definition
 */
export type FrontendEnv = {
  NODE_ENV: 'development' | 'test' | 'production';
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_WS_URL: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  // Add other environment variables as needed
};

/**
 * Provide access to environment variables with fallbacks
 */
export function createEnv(): Partial<FrontendEnv> {
  if (envSchemaModule?.validateFrontendEnv) {
    try {
      return envSchemaModule.validateFrontendEnv(allEnvVars);
    } catch (error) {
      console.error('❌ Invalid environment variables:', error);
      // Continue with fallback validation
    }
  }

  // Fallback: Provide basic validation and defaults
  return {
    NODE_ENV: (allEnvVars.NODE_ENV as any) || 'development',
    NEXT_PUBLIC_API_URL: allEnvVars.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_WS_URL: allEnvVars.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: allEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  };
}

/**
 * Environment configuration with validation
 */
export const env = createEnv();

/**
 * Export default validated environment
 */
export default env;
