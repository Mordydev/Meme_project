/**
 * Error handling system for the application
 * Provides structured error classes for consistent error responses
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * Create a validation error
   */
  static validation(message: string, details?: any): ValidationError {
    return new ValidationError(message, details);
  }

  /**
   * Create an authentication error
   */
  static auth(message: string, details?: any): AuthError {
    return new AuthError(message, details);
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message: string, details?: any): ForbiddenError {
    return new ForbiddenError(message, details);
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string, id?: string): NotFoundError {
    return new NotFoundError(resource, id);
  }

  /**
   * Create a conflict error
   */
  static conflict(message: string, details?: any): ConflictError {
    return new ConflictError(message, details);
  }

  /**
   * Create a rate limit error
   */
  static rateLimit(message: string, details?: any): RateLimitError {
    return new RateLimitError(message, details);
  }

  /**
   * Create a dependency error
   */
  static dependency(service: string, message: string, details?: any): DependencyError {
    return new DependencyError(service, message, details);
  }

  /**
   * Create an internal error
   */
  static internal(message: string, details?: any): AppError {
    return new AppError('internal_error', message, 500, details);
  }
}

/**
 * Validation error for request validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('validation_error', message, 400, details);
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthError extends AppError {
  constructor(message: string, details?: any) {
    super('auth_error', message, 401, details);
  }
}

/**
 * Authorization error for permission failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string, details?: any) {
    super('forbidden', message, 403, details);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'not_found', 
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      404,
      { resource, id }
    );
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super('conflict', message, 409, details);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super('rate_limit_exceeded', message, 429, details);
  }
}

/**
 * Dependency error for external service failures
 */
export class DependencyError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super('dependency_error', `${service}: ${message}`, 502, details);
  }
}

/**
 * Error handler middleware for Fastify
 */
export function errorHandler(error: any, request: any, reply: any) {
  // Handle known AppErrors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: 'validation_error',
        message: 'Validation error',
        details: error.validation,
      },
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  // Generic error handler for unexpected errors
  request.log.error(error);
  
  // In production, don't send stack traces and internal details
  const isProduction = process.env.NODE_ENV === 'production';
  
  return reply.status(error.statusCode || 500).send({
    error: {
      code: 'internal_error',
      message: isProduction ? 'Internal server error' : error.message,
      ...(isProduction ? {} : { stack: error.stack }),
    },
    meta: {
      requestId: request.id,
      timestamp: new Date().toISOString(),
    },
  });
}
