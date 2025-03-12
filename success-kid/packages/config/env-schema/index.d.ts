import { z } from 'zod';

/**
 * Shared environment schema for common variables
 */
export const sharedEnvSchema: z.ZodObject<{
  NODE_ENV: z.ZodEnum<['development', 'test', 'production']>;
}>;

/**
 * Frontend environment schema
 */
export const frontendEnvSchema: z.ZodObject<{
  NODE_ENV: z.ZodEnum<['development', 'test', 'production']>;
  NEXT_PUBLIC_API_URL: z.ZodString;
  NEXT_PUBLIC_WS_URL: z.ZodString;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.ZodString;
}>;

/**
 * Backend environment schema
 */
export const backendEnvSchema: z.ZodObject<{
  NODE_ENV: z.ZodEnum<['development', 'test', 'production']>;
  PORT: z.ZodEffects<z.ZodString, number, string>;
  DATABASE_URL: z.ZodString;
  REDIS_URL: z.ZodString;
  CLERK_SECRET_KEY: z.ZodString;
  JWT_SECRET: z.ZodString;
  CORS_ORIGIN: z.ZodString;
  DEXSCREENER_API_KEY?: z.ZodOptional<z.ZodString>;
  SOLSCAN_API_KEY?: z.ZodOptional<z.ZodString>;
  WEBHOOK_SECRET?: z.ZodOptional<z.ZodString>;
}>;

/**
 * Docker environment schema
 */
export const dockerEnvSchema: z.ZodObject<{
  POSTGRES_USER: z.ZodString;
  POSTGRES_PASSWORD: z.ZodString;
  POSTGRES_DB: z.ZodString;
}>;

/**
 * Frontend environment variables type
 */
export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

/**
 * Backend environment variables type
 */
export type BackendEnv = z.infer<typeof backendEnvSchema>;

/**
 * Docker environment variables type
 */
export type DockerEnv = z.infer<typeof dockerEnvSchema>;

/**
 * Validate frontend environment variables
 */
export function validateFrontendEnv(env: Record<string, string>): FrontendEnv;

/**
 * Validate backend environment variables
 */
export function validateBackendEnv(env: Record<string, string>): BackendEnv;

/**
 * Validate docker environment variables
 */
export function validateDockerEnv(env: Record<string, string>): DockerEnv;
