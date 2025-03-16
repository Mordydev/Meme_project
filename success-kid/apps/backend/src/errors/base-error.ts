/**
 * Base error class for application errors
 * Provides a consistent error structure for the application
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  
  constructor(message: string, code: string, statusCode: number, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Captures stack trace in V8 environments (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Not Found Error
 * Used when a requested resource cannot be found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
      
    super(message, 'RESOURCE_NOT_FOUND', 404);
  }
}

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Authorization Error
 * Used when a user is not authorized to perform an action
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Forbidden Error
 * Used when a user is authenticated but not allowed to access a resource
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Database Error
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message, 
      'DATABASE_ERROR', 
      500, 
      originalError ? { originalError: originalError.message } : undefined
    );
  }
}

/**
 * Rate Limit Error
 * Used when a user exceeds rate limits
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded. Please try again later.') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

/**
 * External Service Error
 * Used when an external service (API, blockchain, etc.) fails
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(
      `${service} service error: ${message}`, 
      'EXTERNAL_SERVICE_ERROR', 
      502, 
      originalError ? { originalError: originalError.message } : undefined
    );
  }
}
