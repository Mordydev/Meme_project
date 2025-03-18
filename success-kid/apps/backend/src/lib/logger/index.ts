/**
 * Logger Module
 * 
 * Provides centralized logging functionality with structured output
 */
import { StructuredLogger, createLogger, LogLevel, LogContext } from './structured-logger';

// Create default logger instance
export const logger: StructuredLogger = createLogger({
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  serviceName: 'success-kid-api',
  serviceVersion: process.env.npm_package_version,
  environment: process.env.NODE_ENV,
  enablePrettyPrint: process.env.NODE_ENV !== 'production',
  redactionPaths: [
    'password',
    'passwordConfirmation',
    'secret',
    'token',
    'authorization',
    'wallet.privateKey',
    'headers.authorization',
    'headers.cookie',
    'user.email'
  ]
});

// Re-export types
export { LogLevel, LogContext, StructuredLogger };

// Export factory function
export { createLogger };

// Create specialized loggers
export const auditLogger = logger.child({ component: 'audit' });
export const securityLogger = logger.child({ component: 'security' });
export const pointsLogger = logger.child({ component: 'points' });
export const walletLogger = logger.child({ component: 'wallet' });
