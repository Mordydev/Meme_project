/**
 * Environment Configuration
 * 
 * This module validates and provides type-safe access to environment variables.
 * It fails fast if required environment variables are missing.
 */

import { validateBackendEnv, type BackendEnv } from '@success-kid/env-schema';
import path from 'path';
import fs from 'fs';

/**
 * Load environment variables from .env file if not in production
 */
function loadEnvFile(): void {
  // Skip in production (environment variables should be set through the deployment platform)
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Try to load environment from .env.local or .env.test
  const envFile = process.env.NODE_ENV === 'test' 
    ? '.env.test'
    : '.env.local';
  
  const envPath = path.resolve(process.cwd(), '..', '..', envFile);
  
  // If the file exists, parse it
  if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    
    // Set environment variables that haven't been set yet
    for (const key in envConfig) {
      if (!process.env[key]) {
        process.env[key] = envConfig[key];
      }
    }
  }
}

// Load environment variables from file if needed
loadEnvFile();

/**
 * Validate environment variables and provide type-safe access
 */
function getValidatedEnvironment(): BackendEnv {
  try {
    return validateBackendEnv(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.format());
    throw new Error('Invalid environment configuration. Please check your environment variables.');
  }
}

// Export validated environment
const env = getValidatedEnvironment();
export default env;
