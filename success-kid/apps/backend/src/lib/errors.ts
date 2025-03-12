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
    
    // For proper instanceof checks with transpiled classes
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
      
    super(message, 'RESOURCE_NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export enum ErrorCode {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Points-specific errors
  POINTS_LIMIT_EXCEEDED = 'POINTS_LIMIT_EXCEEDED',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  POINTS_TRANSFER_FAILED = 'POINTS_TRANSFER_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  REDEMPTION_FAILED = 'REDEMPTION_FAILED',
  
  // Wallet-specific errors
  WALLET_CONNECTION_ERROR = 'WALLET_CONNECTION_ERROR',
  WALLET_VERIFICATION_FAILED = 'WALLET_VERIFICATION_FAILED',
  WALLET_ALREADY_CONNECTED = 'WALLET_ALREADY_CONNECTED',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // Content-specific errors
  CONTENT_CREATION_FAILED = 'CONTENT_CREATION_FAILED',
  CONTENT_MODERATION_REQUIRED = 'CONTENT_MODERATION_REQUIRED',
  CONTENT_TYPE_UNSUPPORTED = 'CONTENT_TYPE_UNSUPPORTED',
  
  // User-specific errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET'
}