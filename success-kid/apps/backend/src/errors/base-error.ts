/**
 * Base error definitions for standardized error handling
 */
import { ErrorCode } from '@success-kid/api-types';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode | string;
  public readonly statusCode: number;
  public readonly details?: any;
  
  constructor(
    message: string, 
    code: ErrorCode | string, 
    statusCode: number, 
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Ensure prototype chain is properly maintained
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number, details?: any) {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
      
    super(message, ErrorCode.RESOURCE_NOT_FOUND, 404, details);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, ErrorCode.UNAUTHORIZED, 401, details);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, ErrorCode.FORBIDDEN, 403, details);
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, details);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, ErrorCode.SERVER_ERROR, 500, details);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode | string = 'CONFLICT', details?: any) {
    super(message, code, 409, details);
  }
}

/**
 * Bad Gateway Error (502)
 */
export class BadGatewayError extends AppError {
  constructor(message: string = 'Bad gateway', details?: any) {
    super(message, 'BAD_GATEWAY', 502, details);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

// Points-specific errors
export class PointsLimitExceededError extends AppError {
  constructor(message: string = 'Points limit exceeded', details?: any) {
    super(message, ErrorCode.POINTS_LIMIT_EXCEEDED, 400, details);
  }
}

export class InsufficientPointsError extends AppError {
  constructor(message: string = 'Insufficient points balance', details?: any) {
    super(message, ErrorCode.INSUFFICIENT_POINTS, 400, details);
  }
}

// Wallet-specific errors
export class WalletConnectionError extends AppError {
  constructor(message: string = 'Wallet connection failed', details?: any) {
    super(message, ErrorCode.WALLET_CONNECTION_ERROR, 400, details);
  }
}

export class WalletVerificationError extends AppError {
  constructor(message: string = 'Wallet verification failed', details?: any) {
    super(message, ErrorCode.WALLET_VERIFICATION_FAILED, 400, details);
  }
}
