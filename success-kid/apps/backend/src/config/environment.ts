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
  COOKIE_SECRET: string;
  FRONTEND_URL: string;
  
  // Clerk configuration
  CLERK_ISSUER: string;
  CLERK_AUDIENCE: string;
  CLERK_JWKS_URL: string;
  
  // Authentication configuration
  AUTH_COOKIE_NAME: string;
  SESSION_TTL: number;
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
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev-cookie-secret',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    
    // Clerk configuration
    CLERK_ISSUER: process.env.CLERK_ISSUER || 'https://clerk.success-kid.com',
    CLERK_AUDIENCE: process.env.CLERK_AUDIENCE || 'success-kid-platform',
    CLERK_JWKS_URL: process.env.CLERK_JWKS_URL || 'https://api.clerk.dev/v1/jwks',
    
    // Authentication configuration
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'sessionId',
    SESSION_TTL: parseInt(process.env.SESSION_TTL || '1209600', 10), // 14 days in seconds
  };

  // Validate required environment variables in production
  if (env.NODE_ENV === 'production') {
    const requiredVars = [
      'DATABASE_URL', 
      'REDIS_URL', 
      'JWT_SECRET',
      'COOKIE_SECRET',
      'CLERK_ISSUER',
      'CLERK_AUDIENCE',
      'CLERK_JWKS_URL'
    ];
    const missingVars = requiredVars.filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Warn about using default secrets in production
    if (env.JWT_SECRET === 'dev-jwt-secret') {
      console.warn('WARNING: Using default JWT_SECRET in production environment!');
    }
    
    if (env.COOKIE_SECRET === 'dev-cookie-secret') {
      console.warn('WARNING: Using default COOKIE_SECRET in production environment!');
    }
  }

  return env;
}

// Export a singleton instance
export const env = loadEnvironment();