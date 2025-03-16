/**
 * AppError - Base error class for application errors
 * 
 * Provides a standardized error structure for all application errors
 * with support for error codes, HTTP status codes, and additional details.
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
    
    // Ensures proper prototypal inheritance
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace in development and test environments
    if (process.env.NODE_ENV !== 'production') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * NotFoundError - Resource not found error
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
 * ValidationError - Input validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * UnauthorizedError - Authentication error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * ForbiddenError - Authorization error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * RateLimitExceededError - Rate limit exceeded error
 */
export class RateLimitExceededError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

/**
 * ConflictError - Resource conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * InternalServerError - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected error occurred', details?: any) {
    super(message, 'SERVER_ERROR', 500, details);
  }
}

/**
 * DatabaseError - Database-related error
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    // Extract detailed info from the original error but don't expose it in production
    const details = process.env.NODE_ENV !== 'production' && originalError 
      ? { originalError: originalError.message, stack: originalError.stack } 
      : undefined;
      
    super(message, 'DATABASE_ERROR', 500, details);
  }
}
