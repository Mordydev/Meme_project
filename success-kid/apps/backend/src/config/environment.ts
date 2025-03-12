/**
 * Environment configuration with validation
 */
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  HOST: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
}

/**
 * Load and validate environment variables
 * This provides type-safe access to environment variables with defaults
 */
export function loadEnvironment(): EnvironmentConfig {
  // Read from env with defaults
  const env: EnvironmentConfig = {
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    HOST: process.env.HOST || '0.0.0.0',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dev:dev@localhost:5432/successKidPlatform',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret',
  };

  // Validate required environment variables in production
  if (env.NODE_ENV === 'production') {
    const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Warn about using default JWT secret in production
    if (env.JWT_SECRET === 'dev-jwt-secret') {
      console.warn('WARNING: Using default JWT_SECRET in production environment!');
    }
  }

  return env;
}

// Export a singleton instance
export const env = loadEnvironment();