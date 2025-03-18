/**
 * Structured Logger
 * 
 * Provides standardized logging with consistent formatting, 
 * context enrichment, and output configuration.
 */
import pino, { Logger as PinoLogger, LoggerOptions, DestinationStream } from 'pino';
import { v4 as uuidv4 } from 'uuid';

// Log levels
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Logger configuration
export interface LoggerConfig {
  level?: LogLevel;
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  enablePrettyPrint?: boolean;
  destination?: DestinationStream;
  redactionPaths?: string[];
  sensitiveHeaders?: string[];
  correlationIdHeader?: string;
}

// Log context interface
export interface LogContext {
  [key: string]: any;
  requestId?: string;
  userId?: string;
  correlationId?: string;
  sessionId?: string;
  path?: string;
  method?: string;
  component?: string;
  action?: string;
}

/**
 * Structured Logger Class
 */
export class StructuredLogger {
  private logger: PinoLogger;
  private serviceName: string;
  private serviceVersion: string;
  private environment: string;
  private sensitiveHeaders: string[];
  private correlationIdHeader: string;
  private baseContext: Record<string, any> = {};

  /**
   * Create new logger instance
   * @param config Logger configuration
   */
  constructor(config: LoggerConfig = {}) {
    this.serviceName = config.serviceName || 'success-kid-api';
    this.serviceVersion = config.serviceVersion || process.env.npm_package_version || '1.0.0';
    this.environment = config.environment || process.env.NODE_ENV || 'development';
    this.sensitiveHeaders = config.sensitiveHeaders || ['authorization', 'cookie', 'x-api-key'];
    this.correlationIdHeader = config.correlationIdHeader || 'x-correlation-id';

    // Set up base logger context
    this.baseContext = {
      service: this.serviceName,
      version: this.serviceVersion,
      env: this.environment
    };

    // Configure logger options
    const loggerOptions: LoggerOptions = {
      level: config.level || LogLevel.INFO,
      redact: {
        paths: config.redactionPaths || [
          'password',
          'passwordConfirmation',
          'secret',
          'token',
          'authorization',
          'content.*.password',
          'headers.authorization',
          'headers.cookie'
        ],
        censor: '[REDACTED]'
      },
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
        req: this.requestSerializer.bind(this)
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: this.baseContext
    };

    // Enable pretty printing for development
    if (config.enablePrettyPrint || (this.environment === 'development' && config.enablePrettyPrint !== false)) {
      this.logger = pino({
        ...loggerOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{msg}'
          }
        }
      });
    } else if (config.destination) {
      // Use custom destination if provided
      this.logger = pino(loggerOptions, config.destination);
    } else {
      // Default logger
      this.logger = pino(loggerOptions);
    }
  }

  /**
   * Generate a correlation ID for tracking related logs
   */
  public generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Create a child logger with additional context
   * @param context Additional context to add to all logs
   */
  public child(context: LogContext): StructuredLogger {
    const childLogger = Object.create(this);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  /**
   * Set a correlation ID for the current logger
   * @param correlationId Correlation ID to set
   */
  public setCorrelationId(correlationId: string): StructuredLogger {
    return this.child({ correlationId });
  }

  /**
   * Log a message at TRACE level
   * @param message Log message
   * @param context Additional log context
   */
  public trace(message: string, context: LogContext = {}): void {
    this.logger.trace(context, message);
  }

  /**
   * Log a message at DEBUG level
   * @param message Log message
   * @param context Additional log context
   */
  public debug(message: string, context: LogContext = {}): void {
    this.logger.debug(context, message);
  }

  /**
   * Log a message at INFO level
   * @param message Log message
   * @param context Additional log context
   */
  public info(message: string, context: LogContext = {}): void {
    this.logger.info(context, message);
  }

  /**
   * Log a message at WARN level
   * @param message Log message
   * @param context Additional log context
   */
  public warn(message: string, context: LogContext = {}): void {
    this.logger.warn(context, message);
  }

  /**
   * Log a message at ERROR level
   * @param message Log message
   * @param context Additional log context
   */
  public error(message: string, context: LogContext = {}): void {
    this.logger.error(context, message);
  }

  /**
   * Log a message at FATAL level
   * @param message Log message
   * @param context Additional log context
   */
  public fatal(message: string, context: LogContext = {}): void {
    this.logger.fatal(context, message);
  }

  /**
   * Log an error with stack trace and context
   * @param error Error object
   * @param message Optional message
   * @param context Additional log context
   */
  public logError(error: Error, message?: string, context: LogContext = {}): void {
    this.logger.error(
      { 
        ...context, 
        err: error,
        stack: error.stack
      }, 
      message || error.message
    );
  }

  /**
   * Create request logger middleware for Fastify
   */
  public createRequestLogger() {
    return (req: any, res: any, next: () => void) => {
      // Extract correlation ID from header or generate new one
      const correlationId = req.headers[this.correlationIdHeader] || this.generateCorrelationId();
      
      // Add correlation ID to response headers
      res.header(this.correlationIdHeader, correlationId);
      
      // Create child logger with request context
      const requestLogger = this.child({
        correlationId,
        requestId: req.id,
        method: req.method,
        path: req.url,
        ip: req.ip
      });
      
      // Attach logger to request
      req.log = requestLogger;
      
      // Log request
      requestLogger.info(`${req.method} ${req.url}`, {
        query: req.query,
        params: req.params
      });
      
      // Continue
      next();
    };
  }

  /**
   * Custom request serializer
   */
  private requestSerializer(req: any): Record<string, any> {
    if (!req) return {};
    
    // Basic request info
    const serialized: Record<string, any> = {
      id: req.id,
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      httpVersion: req.httpVersion,
      remoteAddr: req.ip,
      remotePort: req.socket && req.socket.remotePort
    };
    
    // Add headers (filtering sensitive headers)
    if (req.headers) {
      serialized.headers = { ...req.headers };
      
      for (const header of this.sensitiveHeaders) {
        if (serialized.headers[header]) {
          serialized.headers[header] = '[REDACTED]';
        }
      }
    }
    
    return serialized;
  }
}

// Default logger instance
export const createLogger = (config: LoggerConfig = {}): StructuredLogger => {
  return new StructuredLogger(config);
};
