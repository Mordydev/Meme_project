/**
 * API Error Classes
 * 
 * Standardized error classes for API responses
 */
import { BaseError } from './base-error';
import { ErrorCode } from './error-codes';

/**
 * NotFoundError
 * HTTP 404 Not Found
 */
export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorCode.RESOURCE_NOT_FOUND, 404);
  }
}

/**
 * BadRequestError
 * HTTP 400 Bad Request
 */
export class BadRequestError extends BaseError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

/**
 * UnauthorizedError
 * HTTP 401 Unauthorized
 */
export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.UNAUTHORIZED, 401);
  }
}

/**
 * ForbiddenError
 * HTTP 403 Forbidden
 */
export class ForbiddenError extends BaseError {
  constructor(message: string = 'Access denied') {
    super(message, ErrorCode.FORBIDDEN, 403);
  }
}

/**
 * ConflictError
 * HTTP 409 Conflict
 */
export class ConflictError extends BaseError {
  constructor(message: string = 'Resource conflict') {
    super(message, ErrorCode.CONFLICT, 409);
  }
}

/**
 * RateLimitExceededError
 * HTTP 429 Too Many Requests
 */
export class RateLimitExceededError extends BaseError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429);
  }
}

/**
 * InternalServerError
 * HTTP 500 Internal Server Error
 */
export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error') {
    super(message, ErrorCode.SERVER_ERROR, 500);
  }
}

/**
 * ServiceUnavailableError
 * HTTP 503 Service Unavailable
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service unavailable') {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503);
  }
}

/**
 * ValidationError
 * HTTP 400 Bad Request with validation details
 */
export class ValidationError extends BadRequestError {
  constructor(message: string = 'Validation error', details?: any) {
    super(message, details);
    this.code = ErrorCode.VALIDATION_ERROR;
  }
}

/**
 * PointsLimitError
 * HTTP 400 Bad Request for points limit exceeded
 */
export class PointsLimitError extends BadRequestError {
  constructor(message: string = 'Points limit exceeded') {
    super(message);
    this.code = ErrorCode.POINTS_LIMIT_EXCEEDED;
  }
}

/**
 * InsufficientPointsError
 * HTTP 400 Bad Request for insufficient points
 */
export class InsufficientPointsError extends BadRequestError {
  constructor(message: string = 'Insufficient points') {
    super(message);
    this.code = ErrorCode.INSUFFICIENT_POINTS;
  }
}

/**
 * WalletConnectionError
 * HTTP 400 Bad Request for wallet connection issues
 */
export class WalletConnectionError extends BadRequestError {
  constructor(message: string = 'Wallet connection error') {
    super(message);
    this.code = ErrorCode.WALLET_CONNECTION_ERROR;
  }
}

/**
 * ContentModerationError
 * HTTP 400 Bad Request for content moderation issues
 */
export class ContentModerationError extends BadRequestError {
  constructor(message: string = 'Content moderation required') {
    super(message);
    this.code = ErrorCode.CONTENT_MODERATION_REQUIRED;
  }
}

/**
 * WebSocketError
 * WebSocket-specific error
 */
export class WebSocketError extends BaseError {
  /**
   * WebSocket close code
   */
  closeCode: number;
  
  constructor(
    message: string = 'WebSocket error',
    code: ErrorCode = ErrorCode.WEBSOCKET_ERROR,
    statusCode: number = 400,
    closeCode: number = 1008
  ) {
    super(message, code, statusCode);
    this.closeCode = closeCode;
  }
}

/**
 * WebSocketAuthError
 * WebSocket authentication error
 */
export class WebSocketAuthError extends WebSocketError {
  constructor(message: string = 'WebSocket authentication failed') {
    super(message, ErrorCode.WEBSOCKET_AUTH_FAILED, 401, 1008);
  }
}

/**
 * WebSocketRateLimitError
 * WebSocket rate limit error
 */
export class WebSocketRateLimitError extends WebSocketError {
  constructor(message: string = 'WebSocket rate limit exceeded') {
    super(message, ErrorCode.WEBSOCKET_RATE_LIMIT, 429, 1008);
  }
}

/**
 * WebSocketConnectionLimitError
 * WebSocket connection limit error
 */
export class WebSocketConnectionLimitError extends WebSocketError {
  constructor(message: string = 'WebSocket connection limit exceeded') {
    super(message, ErrorCode.WEBSOCKET_CONNECTION_LIMIT, 429, 1013);
  }
}
