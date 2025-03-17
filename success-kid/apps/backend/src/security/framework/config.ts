/**
 * Security Configuration
 * 
 * Configuration for the security framework
 */
import { FastifyInstance } from 'fastify';
import { SecurityConfig } from './types';

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  headers: {
    enabled: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
        connectSrc: ["'self'", "https://*.success-kid.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    strictTransportSecurity: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    },
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: "camera=(), microphone=(), geolocation=()"
  },
  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  rateLimiting: {
    enabled: true,
    max: 100,
    timeWindow: '1 minute',
    skipOnError: true
  },
  csrf: {
    enabled: true,
    cookie: {
      key: 'csrf',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    ignorePaths: ['/api/v1/public', '/health', '/api/v1/webhook'],
    tokenLength: 32,
    headerName: 'x-csrf-token',
    tokenRotation: true,
    rotationInterval: 3600 // 1 hour
  }
};

/**
 * Register security configuration with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function registerSecurityConfig(fastify: FastifyInstance): Promise<void> {
  // Load environment-specific configuration
  const envConfig = getEnvironmentConfig();
  
  // Merge default and environment configurations
  const config = {
    ...defaultSecurityConfig,
    ...envConfig
  };
  
  // Register configuration with Fastify
  if (!fastify.config) {
    fastify.decorate('config', {});
  }
  
  fastify.config.security = config;
  
  fastify.log.debug('Security configuration registered');
}

/**
 * Get environment-specific security configuration
 * 
 * @returns Partial security configuration for current environment
 */
function getEnvironmentConfig(): Partial<SecurityConfig> {
  // Development environment configuration
  if (process.env.NODE_ENV === 'development') {
    return {
      headers: {
        ...defaultSecurityConfig.headers,
        contentSecurityPolicy: {
          directives: {
            ...defaultSecurityConfig.headers.contentSecurityPolicy?.directives,
            // Allow localhost for development
            connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "https://*.success-kid.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
          }
        },
        strictTransportSecurity: {
          ...defaultSecurityConfig.headers.strictTransportSecurity,
          // Shorter maxAge for development
          maxAge: 300 // 5 minutes
        }
      },
      cors: {
        ...defaultSecurityConfig.cors,
        // Allow any origin in development
        origin: '*'
      }
    };
  }
  
  // Test environment configuration
  if (process.env.NODE_ENV === 'test') {
    return {
      headers: {
        ...defaultSecurityConfig.headers,
        enabled: false // Disable security headers for testing
      },
      csrf: {
        ...defaultSecurityConfig.csrf,
        enabled: false // Disable CSRF for testing
      }
    };
  }
  
  // Production configuration is the default
  return {};
}
