/**
 * Configuration loader for the application
 * Loads configuration from environment variables with sensible defaults
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  // Server configuration
  host: string;
  port: number;
  isDevelopment: boolean;
  
  // CORS configuration
  corsOrigin: string | RegExp | Array<string | RegExp>;
  
  // Rate limiting
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  
  // Supabase configuration
  supabase: {
    url: string;
    key: string;
    serviceKey?: string;
  };
  
  // Redis (for caching and websockets)
  redis: {
    url: string;
    password?: string;
    ttl: number; // Default TTL for cache in seconds
  };
  
  // Logging
  logger: {
    level: string;
    prettyPrint: boolean;
  };
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return {
    // Server configuration
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3001', 10),
    isDevelopment,
    
    // CORS configuration - more restrictive in production
    corsOrigin: isDevelopment 
      ? '*' 
      : process.env.CORS_ORIGIN?.split(',') || ['https://wildnout.io'],
    
    // Rate limiting - more permissive in development
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || (isDevelopment ? '1000' : '100'), 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    },
    
    // Supabase configuration
    supabase: {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_ANON_KEY || '',
      serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },
    
    // Redis configuration
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      ttl: parseInt(process.env.REDIS_CACHE_TTL || '3600', 10), // Default 1 hour
    },
    
    // Logging configuration
    logger: {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      prettyPrint: isDevelopment,
    },
  };
}

// Export singleton instance for convenience
export const config = loadConfig();
