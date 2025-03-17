/**
 * Error Codes
 * 
 * Standardized error codes for the application
 */

/**
 * Application error codes
 */
export enum ErrorCode {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFLICT = 'CONFLICT',
  
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
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET',
  
  // WebSocket-specific errors
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  WEBSOCKET_AUTH_FAILED = 'WEBSOCKET_AUTH_FAILED',
  WEBSOCKET_RATE_LIMIT = 'WEBSOCKET_RATE_LIMIT',
  WEBSOCKET_CONNECTION_LIMIT = 'WEBSOCKET_CONNECTION_LIMIT',
  WEBSOCKET_MESSAGE_INVALID = 'WEBSOCKET_MESSAGE_INVALID',
  WEBSOCKET_SUBSCRIPTION_DENIED = 'WEBSOCKET_SUBSCRIPTION_DENIED'
}

/**
 * HTTP status code for each error code
 */
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.CONFLICT]: 409,
  
  [ErrorCode.POINTS_LIMIT_EXCEEDED]: 400,
  [ErrorCode.INSUFFICIENT_POINTS]: 400,
  [ErrorCode.POINTS_TRANSFER_FAILED]: 500,
  [ErrorCode.SUSPICIOUS_ACTIVITY]: 403,
  [ErrorCode.REDEMPTION_FAILED]: 500,
  
  [ErrorCode.WALLET_CONNECTION_ERROR]: 400,
  [ErrorCode.WALLET_VERIFICATION_FAILED]: 400,
  [ErrorCode.WALLET_ALREADY_CONNECTED]: 409,
  [ErrorCode.BLOCKCHAIN_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,
  
  [ErrorCode.CONTENT_CREATION_FAILED]: 500,
  [ErrorCode.CONTENT_MODERATION_REQUIRED]: 400,
  [ErrorCode.CONTENT_TYPE_UNSUPPORTED]: 415,
  
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.PROFILE_UPDATE_FAILED]: 500,
  [ErrorCode.ACHIEVEMENT_CRITERIA_UNMET]: 400,
  
  [ErrorCode.WEBSOCKET_ERROR]: 400,
  [ErrorCode.WEBSOCKET_AUTH_FAILED]: 401,
  [ErrorCode.WEBSOCKET_RATE_LIMIT]: 429,
  [ErrorCode.WEBSOCKET_CONNECTION_LIMIT]: 429,
  [ErrorCode.WEBSOCKET_MESSAGE_INVALID]: 400,
  [ErrorCode.WEBSOCKET_SUBSCRIPTION_DENIED]: 403
};

/**
 * WebSocket close codes for each error code
 */
export const WebSocketCloseCodes: Record<string, number> = {
  [ErrorCode.WEBSOCKET_AUTH_FAILED]: 1008, // Policy violation
  [ErrorCode.WEBSOCKET_RATE_LIMIT]: 1008, // Policy violation
  [ErrorCode.WEBSOCKET_CONNECTION_LIMIT]: 1013, // Try again later
  [ErrorCode.WEBSOCKET_MESSAGE_INVALID]: 1007, // Invalid data
  [ErrorCode.WEBSOCKET_SUBSCRIPTION_DENIED]: 1008, // Policy violation
  [ErrorCode.UNAUTHORIZED]: 1008, // Policy violation
  [ErrorCode.FORBIDDEN]: 1008, // Policy violation
  
  // Generic close codes
  'NORMAL_CLOSURE': 1000,
  'SERVER_SHUTDOWN': 1001,
  'PROTOCOL_ERROR': 1002,
  'DATA_ERROR': 1007,
  'POLICY_VIOLATION': 1008,
  'MESSAGE_TOO_BIG': 1009,
  'TRY_AGAIN_LATER': 1013
};

/**
 * Error messages for each error code
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.SERVER_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
  [ErrorCode.CONFLICT]: 'Resource conflict',
  
  [ErrorCode.POINTS_LIMIT_EXCEEDED]: 'Points limit exceeded',
  [ErrorCode.INSUFFICIENT_POINTS]: 'Insufficient points',
  [ErrorCode.POINTS_TRANSFER_FAILED]: 'Points transfer failed',
  [ErrorCode.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
  [ErrorCode.REDEMPTION_FAILED]: 'Points redemption failed',
  
  [ErrorCode.WALLET_CONNECTION_ERROR]: 'Wallet connection error',
  [ErrorCode.WALLET_VERIFICATION_FAILED]: 'Wallet verification failed',
  [ErrorCode.WALLET_ALREADY_CONNECTED]: 'Wallet already connected to another account',
  [ErrorCode.BLOCKCHAIN_ERROR]: 'Blockchain error',
  [ErrorCode.TRANSACTION_FAILED]: 'Blockchain transaction failed',
  
  [ErrorCode.CONTENT_CREATION_FAILED]: 'Content creation failed',
  [ErrorCode.CONTENT_MODERATION_REQUIRED]: 'Content requires moderation',
  [ErrorCode.CONTENT_TYPE_UNSUPPORTED]: 'Content type not supported',
  
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.PROFILE_UPDATE_FAILED]: 'Profile update failed',
  [ErrorCode.ACHIEVEMENT_CRITERIA_UNMET]: 'Achievement criteria not met',
  
  [ErrorCode.WEBSOCKET_ERROR]: 'WebSocket error',
  [ErrorCode.WEBSOCKET_AUTH_FAILED]: 'WebSocket authentication failed',
  [ErrorCode.WEBSOCKET_RATE_LIMIT]: 'WebSocket rate limit exceeded',
  [ErrorCode.WEBSOCKET_CONNECTION_LIMIT]: 'WebSocket connection limit exceeded',
  [ErrorCode.WEBSOCKET_MESSAGE_INVALID]: 'Invalid WebSocket message',
  [ErrorCode.WEBSOCKET_SUBSCRIPTION_DENIED]: 'WebSocket subscription denied'
};
