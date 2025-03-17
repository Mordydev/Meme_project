/**
 * CSRF Configuration
 * 
 * Configuration settings for CSRF protection
 */
import { CsrfConfig } from '../framework/types';

/**
 * Default CSRF configuration
 */
export const CSRF_CONFIG: CsrfConfig = {
  enabled: true,
  cookie: {
    key: 'csrf',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePaths: [
    '/api/v1/webhook',
    '/api/v1/public',
    '/health',
    '/metrics'
  ],
  tokenLength: 32,
  headerName: 'x-csrf-token',
  tokenRotation: true,
  rotationInterval: 3600 // 1 hour in seconds
};

/**
 * Get environment-specific CSRF configuration
 * 
 * @returns CSRF configuration for current environment
 */
export function getEnvironmentConfig(): CsrfConfig {
  const baseConfig = { ...CSRF_CONFIG };
  
  // Development-specific configuration
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      cookie: {
        ...baseConfig.cookie,
        secure: false, // Allow HTTP in development
      },
      // Add development-specific paths to ignore
      ignorePaths: [
        ...baseConfig.ignorePaths,
        '/api/v1/debug'
      ]
    };
  }
  
  // Test-specific configuration
  if (process.env.NODE_ENV === 'test') {
    return {
      ...baseConfig,
      enabled: false, // Disable CSRF protection in tests
    };
  }
  
  // Return base config for production
  return baseConfig;
}
