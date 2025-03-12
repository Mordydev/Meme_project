// Environment schema for Success Kid Community Platform
const { z } = require('zod');

/**
 * Shared environment schema for common variables
 */
const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Frontend environment schema
 */
const frontendEnvSchema = sharedEnvSchema.extend({
  // Public variables (accessible in the browser)
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WS_URL: z.string(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Backend environment schema
 */
const backendEnvSchema = sharedEnvSchema.extend({
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  CLERK_SECRET_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string(),
  
  // API keys for external services
  DEXSCREENER_API_KEY: z.string().optional(),
  SOLSCAN_API_KEY: z.string().optional(),
  
  // Webhook secrets
  WEBHOOK_SECRET: z.string().optional(),
});

/**
 * Docker environment schema
 */
const dockerEnvSchema = z.object({
  POSTGRES_USER: z.string().default('dev'),
  POSTGRES_PASSWORD: z.string().default('dev'),
  POSTGRES_DB: z.string().default('successKidPlatform'),
});

/**
 * Validate frontend environment variables
 * @param {Object} env - Environment variables object
 * @returns {Object} - Validated environment variables
 */
function validateFrontendEnv(env) {
  return frontendEnvSchema.parse(env);
}

/**
 * Validate backend environment variables
 * @param {Object} env - Environment variables object
 * @returns {Object} - Validated environment variables
 */
function validateBackendEnv(env) {
  return backendEnvSchema.parse(env);
}

/**
 * Validate docker environment variables
 * @param {Object} env - Environment variables object
 * @returns {Object} - Validated environment variables
 */
function validateDockerEnv(env) {
  return dockerEnvSchema.parse(env);
}

module.exports = {
  validateFrontendEnv,
  validateBackendEnv,
  validateDockerEnv,
  frontendEnvSchema,
  backendEnvSchema,
  dockerEnvSchema,
};
