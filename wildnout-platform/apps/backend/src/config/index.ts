/**
 * Configuration loader for the application
 * Loads configuration from environment variables with sensible defaults
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  // Security configurations
  security: {
    encryptionSecret: string;
    encryptionSalt: string;
    pseudonymizationSalt: string;
    csrfEnabled: boolean;
  };
  // Blockchain configuration
  solana: {
    rpcUrls: string[];
    tokenMint: string;
    networkType: 'mainnet-beta' | 'testnet' | 'devnet';
    explorerUrl: string;
  };

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
  
  // Clerk authentication
  clerk: {
    secretKey: string;
    publishableKey: string;
    webhookSecret?: string;
    jwtVerificationStrategy: 'local' | 'remote';
    tokenCacheEnabled: boolean;
    tokenCacheTtl: number; // In seconds
  };
  
  // Blockchain rate limiting
  blockchainRateLimit: {
    requestsPerSecond: number;
    maxConcurrent: number;
  };

  // Logging
  logger: {
    level: string;
    prettyPrint: boolean;
  };
  
  // Security encryption and hash keys
  encryptionSecret?: string;
  encryptionSalt?: string;
  pseudonymizationSalt?: string;;
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
    
    // Clerk authentication
    clerk: {
      secretKey: process.env.CLERK_SECRET_KEY || '',
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
      jwtVerificationStrategy: (process.env.CLERK_JWT_VERIFICATION_STRATEGY as 'local' | 'remote') || 'local',
      tokenCacheEnabled: process.env.CLERK_TOKEN_CACHE_ENABLED !== 'false',
      tokenCacheTtl: parseInt(process.env.CLERK_TOKEN_CACHE_TTL || '300', 10), // Default 5 minutes
    },
    
    // Blockchain configuration
    solana: {
      rpcUrls: process.env.SOLANA_RPC_URLS?.split(',') || [
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.g.alchemy.com/v2/demo',
        'https://rpc.ankr.com/solana'
      ],
      tokenMint: process.env.SOLANA_TOKEN_MINT || '',
      networkType: (process.env.SOLANA_NETWORK || 'mainnet-beta') as 'mainnet-beta' | 'testnet' | 'devnet',
      explorerUrl: process.env.SOLANA_EXPLORER_URL || 'https://explorer.solana.com',
    },

    // Blockchain rate limiting
    blockchainRateLimit: {
      requestsPerSecond: parseInt(process.env.BLOCKCHAIN_RATE_LIMIT_RPS || '10', 10),
      maxConcurrent: parseInt(process.env.BLOCKCHAIN_RATE_LIMIT_CONCURRENT || '25', 10),
    },

    // Logging configuration
    logger: {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      prettyPrint: isDevelopment,
    },
    
    // Security configuration
    security: {
      encryptionSecret: process.env.ENCRYPTION_SECRET || '',
      encryptionSalt: process.env.ENCRYPTION_SALT || 'wildnout-platform',
      pseudonymizationSalt: process.env.PSEUDONYMIZATION_SALT || 'wildnout-platform-pseudo',
      csrfEnabled: process.env.CSRF_ENABLED !== 'false',
    },
    
    // Encryption and hash keys (deprecated, use security object)
    encryptionSecret: process.env.ENCRYPTION_SECRET || '',
    encryptionSalt: process.env.ENCRYPTION_SALT || 'wildnout-platform',
    pseudonymizationSalt: process.env.PSEUDONYMIZATION_SALT || 'wildnout-platform-pseudo',
  };
}

// Export singleton instance for convenience
export const config = loadConfig();
