/**
 * Comprehensive error code system - shared with frontend
 * These codes should be kept in sync with the frontend error handling
 */
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
  CONTENT_OPERATION_FAILED = 'CONTENT_OPERATION_FAILED',
  COMMENT_OPERATION_FAILED = 'COMMENT_OPERATION_FAILED',
  MODERATION_OPERATION_FAILED = 'MODERATION_OPERATION_FAILED',
  CATEGORY_OPERATION_FAILED = 'CATEGORY_OPERATION_FAILED',
  TAG_OPERATION_FAILED = 'TAG_OPERATION_FAILED',
  
  // User-specific errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  
  // Feature flag errors
  FEATURE_DISABLED = 'FEATURE_DISABLED',
}

/**
 * Maps error codes to default messages and status codes
 */
export const errorCodeMap: Record<ErrorCode, { message: string; statusCode: number }> = {
  [ErrorCode.VALIDATION_ERROR]: { message: 'Invalid input data', statusCode: 400 },
  [ErrorCode.RESOURCE_NOT_FOUND]: { message: 'Resource not found', statusCode: 404 },
  [ErrorCode.UNAUTHORIZED]: { message: 'Authentication required', statusCode: 401 },
  [ErrorCode.FORBIDDEN]: { message: 'Permission denied', statusCode: 403 },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: { message: 'Rate limit exceeded', statusCode: 429 },
  [ErrorCode.SERVER_ERROR]: { message: 'Internal server error', statusCode: 500 },
  
  [ErrorCode.POINTS_LIMIT_EXCEEDED]: { message: 'Points limit exceeded', statusCode: 400 },
  [ErrorCode.INSUFFICIENT_POINTS]: { message: 'Insufficient points balance', statusCode: 400 },
  [ErrorCode.POINTS_TRANSFER_FAILED]: { message: 'Points transfer failed', statusCode: 500 },
  [ErrorCode.SUSPICIOUS_ACTIVITY]: { message: 'Suspicious activity detected', statusCode: 403 },
  [ErrorCode.REDEMPTION_FAILED]: { message: 'Points redemption failed', statusCode: 500 },
  
  [ErrorCode.WALLET_CONNECTION_ERROR]: { message: 'Wallet connection failed', statusCode: 400 },
  [ErrorCode.WALLET_VERIFICATION_FAILED]: { message: 'Wallet verification failed', statusCode: 400 },
  [ErrorCode.WALLET_ALREADY_CONNECTED]: { message: 'Wallet already connected', statusCode: 409 },
  [ErrorCode.BLOCKCHAIN_ERROR]: { message: 'Blockchain operation failed', statusCode: 502 },
  [ErrorCode.TRANSACTION_FAILED]: { message: 'Transaction failed', statusCode: 500 },
  
  [ErrorCode.CONTENT_CREATION_FAILED]: { message: 'Content creation failed', statusCode: 500 },
  [ErrorCode.CONTENT_MODERATION_REQUIRED]: { message: 'Content requires moderation', statusCode: 403 },
  [ErrorCode.CONTENT_TYPE_UNSUPPORTED]: { message: 'Content type not supported', statusCode: 400 },
  [ErrorCode.CONTENT_OPERATION_FAILED]: { message: 'Content operation failed', statusCode: 400 },
  [ErrorCode.COMMENT_OPERATION_FAILED]: { message: 'Comment operation failed', statusCode: 400 },
  [ErrorCode.MODERATION_OPERATION_FAILED]: { message: 'Moderation operation failed', statusCode: 400 },
  [ErrorCode.CATEGORY_OPERATION_FAILED]: { message: 'Category operation failed', statusCode: 400 },
  [ErrorCode.TAG_OPERATION_FAILED]: { message: 'Tag operation failed', statusCode: 400 },
  
  [ErrorCode.USER_ALREADY_EXISTS]: { message: 'User already exists', statusCode: 409 },
  [ErrorCode.PROFILE_UPDATE_FAILED]: { message: 'Profile update failed', statusCode: 500 },
  [ErrorCode.ACHIEVEMENT_CRITERIA_UNMET]: { message: 'Achievement criteria not met', statusCode: 400 },
  
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: { message: 'External service error', statusCode: 502 },
  
  [ErrorCode.DATABASE_ERROR]: { message: 'Database operation failed', statusCode: 500 },
  [ErrorCode.TRANSACTION_ERROR]: { message: 'Database transaction failed', statusCode: 500 },
  
  [ErrorCode.FEATURE_DISABLED]: { message: 'This feature is currently disabled', statusCode: 404 },
};
