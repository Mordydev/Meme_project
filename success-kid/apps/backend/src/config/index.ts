/**
 * Application Configuration
 * 
 * Centralizes all configuration for the application
 */
import 'dotenv/config';
import { databaseConfig } from './database';

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
  },
  
  // Database configuration
  database: databaseConfig,
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d',
    cookieSecret: process.env.COOKIE_SECRET || 'change-me-in-production',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
    clerkJwksCacheMaxAge: parseInt(process.env.CLERK_JWKS_CACHE_MAX_AGE || '3600000', 10)
  },
  
  // Points system configuration
  points: {
    defaultDailyLimit: 1000,
    dailyLimits: {
      content_creation: 200,
      comment: 150,
      upvote_received: 100,
      daily_login: 20,
      referral: 500
    },
    redemptionRate: 100, // 100 SP = 1 SKC
    weeklyRedemptionLimit: 10000, // 10,000 SP (100 SKC) per week
    minimumRedemption: 1000 // 1,000 SP (10 SKC) minimum
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    prefix: process.env.REDIS_PREFIX || 'sk:'
  },
  
  // Feature flags
  features: {
    enableWalletIntegration: process.env.ENABLE_WALLET_INTEGRATION !== 'false',
    enableRealTimeUpdates: process.env.ENABLE_REAL_TIME_UPDATES !== 'false',
    enablePointsRedemption: process.env.ENABLE_POINTS_REDEMPTION === 'true',
    enableContentModeration: process.env.ENABLE_CONTENT_MODERATION === 'true'
  },
  
  // API limits
  limits: {
    contentMaxLength: parseInt(process.env.CONTENT_MAX_LENGTH || '5000', 10),
    commentMaxLength: parseInt(process.env.COMMENT_MAX_LENGTH || '1000', 10),
    uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10), // 5MB
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10)
  }
};

/**
 * Validate the application configuration
 * Throws error if configuration is invalid
 */
export function validateConfig(): void {
  // Validate server config
  if (!config.server.port || isNaN(config.server.port)) {
    throw new Error('Invalid server port configuration');
  }
  
  // Validate database config
  if (!config.database.host || !config.database.database) {
    throw new Error('Invalid database configuration');
  }
  
  // Validate auth config in production
  if (config.server.isProd && (
    !config.auth.jwtSecret || 
    config.auth.jwtSecret === 'change-me-in-production' ||
    !config.auth.cookieSecret ||
    config.auth.cookieSecret === 'change-me-in-production'
  )) {
    throw new Error('Production environment requires proper JWT and cookie secrets');
  }
}
