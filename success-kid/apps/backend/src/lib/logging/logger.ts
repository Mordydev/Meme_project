/**
 * Structured logging system for the Success Kid platform
 * 
 * Provides consistent, configurable logging with appropriate formats,
 * levels, and transport options.
 */
import pino, { LoggerOptions, Logger, DestinationStream } from 'pino';
import { randomUUID } from 'crypto';

/**
 * Log levels with numeric values
 */
export const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Application context for logs
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  component?: string;
  [key: string]: any;
}

/**
 * Log redaction configuration
 */
interface RedactionConfig {
  paths: string[];
  censor: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  name?: string;
  level?: LogLevel;
  pretty?: boolean;
  destination?: DestinationStream;
  redaction?: RedactionConfig;
  defaultContext?: LogContext;
}

/**
 * Create a structured logger instance
 * 
 * @param config Logger configuration
 * @returns Configured logger instance
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Default level based on environment
  const level = config.level || (isProd ? 'info' : 'debug');
  
  // Default redaction paths for sensitive data
  const defaultRedaction: RedactionConfig = {
    paths: [
      'password',
      'passwordConfirmation',
      'email',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      '*.password',
      'request.headers.authorization',
      'request.headers.cookie',
      'user.email',
      'wallet.privateKey',
      'wallet.address',
      'card.*',
    ],
    censor: '[REDACTED]'
  };
  
  // Merge with any custom redaction configuration
  const redaction = config.redaction 
    ? { 
        paths: [...defaultRedaction.paths, ...config.redaction.paths],
        censor: config.redaction.censor || defaultRedaction.censor
      }
    : defaultRedaction;
  
  // Base logger options
  const options: LoggerOptions = {
    name: config.name || 'success-kid-api',
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: redaction.paths,
      censor: redaction.censor
    },
    base: {
      env: process.env.NODE_ENV,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
    },
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    serializers: {
      // Standard serializers
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      
      // Custom serializers
      context: (context) => context,
    },
  };
  
  // Add pretty printing in development
  if (!isProd && config.pretty !== false) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      }
    };
  }
  
  // Create the base logger
  const baseLogger = pino(options, config.destination);
  
  // Create a wrapper to automatically include the default context
  const logger = baseLogger.child(config.defaultContext || {});
  
  return logger;
}

/**
 * Create a child logger with additional context
 * 
 * @param parentLogger Parent logger instance
 * @param context Additional context to include in logs
 * @returns Child logger instance
 */
export function createChildLogger(parentLogger: Logger, context: LogContext): Logger {
  return parentLogger.child(context);
}

/**
 * Create a request-scoped logger with request context
 * 
 * @param parentLogger Parent logger instance
 * @param request Fastify request object
 * @returns Request-scoped logger instance
 */
export function createRequestLogger(parentLogger: Logger, request: any): Logger {
  const requestId = request.id || randomUUID();
  
  const context: LogContext = {
    requestId,
    method: request.method,
    path: request.url,
    ip: request.ip,
    userId: request.user?.id,
  };
  
  return createChildLogger(parentLogger, context);
}

// Create the root application logger
export const logger = createLogger();

// Export default logger for convenience
export default logger;