/**
 * Health Module
 */
export * from './types';
export * from './checks';

/**
 * Generates the application version info
 */
export function getVersionInfo(): { version: string, environment: string } {
  return {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
}
