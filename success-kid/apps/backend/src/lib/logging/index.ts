/**
 * Logging module index
 * 
 * Provides centralized access to logging utilities and configuration.
 */
import pino from 'pino';
import { createLogger, createChildLogger, createRequestLogger, logger } from './logger';
import { createRequestLoggingMiddleware } from './request-logger';

/**
 * Log redaction utilities
 */
export const redactionUtils = {
  /**
   * Redact sensitive information from an object
   * 
   * @param obj Object to redact
   * @param paths Paths to redact
   * @param censor Value to replace sensitive data with
   * @returns Redacted object
   */
  redactObject: (
    obj: Record<string, any>,
    paths: string[] = ['password', 'token', 'apiKey', 'secret'],
    censor: string = '[REDACTED]'
  ): Record<string, any> => {
    // Create a copy to avoid modifying the original
    const result = JSON.parse(JSON.stringify(obj));
    
    // Helper function to check if a string matches a pattern
    const matchesPattern = (key: string, pattern: string): boolean => {
      if (pattern.includes('*')) {
        // Handle wildcard pattern (e.g., "*.password")
        const regex = new RegExp(
          '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
        );
        return regex.test(key);
      }
      return key === pattern;
    };
    
    // Recursive function to redact values
    const redact = (obj: Record<string, any>, path: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if current path should be redacted
        const shouldRedact = paths.some(pattern => matchesPattern(currentPath, pattern));
        
        if (shouldRedact) {
          obj[key] = censor;
        } else if (value && typeof value === 'object') {
          // Recurse into nested objects
          redact(value, currentPath);
        }
      }
    };
    
    redact(result);
    return result;
  },
  
  /**
   * Redact sensitive information from error objects
   */
  redactError: (error: Error, censor: string = '[REDACTED]'): Error => {
    const result = { ...error } as any;
    
    // Some common sensitive properties in errors
    const sensitiveProps = [
      'password',
      'token',
      'authorization',
      'apiKey',
      'secret',
      'credentials',
    ];
    
    // Redact sensitive properties from error object
    for (const prop of sensitiveProps) {
      if (prop in result) {
        result[prop] = censor;
      }
    }
    
    // Redact from stack trace if it exists
    if (result.stack) {
      for (const prop of sensitiveProps) {
        const regex = new RegExp(`${prop}[^\\s&,)]*`, 'gi');
        result.stack = result.stack.replace(regex, `${prop}=${censor}`);
      }
    }
    
    return result;
  }
};

// Re-export the logger and utilities
export {
  logger,
  createLogger,
  createChildLogger,
  createRequestLogger,
  createRequestLoggingMiddleware,
};

// Export pino serializers
export const serializers = {
  ...pino.stdSerializers,
};

// Default export for convenient imports
export default {
  logger,
  createLogger,
  createChildLogger,
  createRequestLogger,
  createRequestLoggingMiddleware,
  redactionUtils,
  serializers,
};