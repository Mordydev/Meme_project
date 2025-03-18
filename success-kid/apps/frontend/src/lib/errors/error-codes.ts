/**
 * Error Codes
 * 
 * Standardized error codes across the platform
 */

export enum ErrorCode {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  CONFLICT = 'CONFLICT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CLIENT_ERROR = 'CLIENT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
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
  
  // WebSocket errors
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  WEBSOCKET_AUTH_FAILED = 'WEBSOCKET_AUTH_FAILED',
  WEBSOCKET_RATE_LIMIT = 'WEBSOCKET_RATE_LIMIT',
  WEBSOCKET_CONNECTION_LIMIT = 'WEBSOCKET_CONNECTION_LIMIT',
  
  // Connection/request errors
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  BROWSER_SUPPORT_ERROR = 'BROWSER_SUPPORT_ERROR',
  DEVICE_CAPABILITY_ERROR = 'DEVICE_CAPABILITY_ERROR',
  RESOURCE_LOAD_ERROR = 'RESOURCE_LOAD_ERROR'
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'The provided input is invalid',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource could not be found',
  [ErrorCode.UNAUTHORIZED]: 'Authentication is required to access this resource',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests, please try again later',
  [ErrorCode.SERVER_ERROR]: 'Something went wrong on our end, please try again later',
  [ErrorCode.CONFLICT]: 'This operation conflicts with the current state of the resource',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'This service is temporarily unavailable, please try again later',
  [ErrorCode.CLIENT_ERROR]: 'An error occurred in the app',
  [ErrorCode.NETWORK_ERROR]: 'Network connection error, please check your internet connection',
  
  [ErrorCode.POINTS_LIMIT_EXCEEDED]: 'You have reached your points limit for this activity',
  [ErrorCode.INSUFFICIENT_POINTS]: 'You do not have enough points for this action',
  [ErrorCode.POINTS_TRANSFER_FAILED]: 'Failed to transfer points, please try again',
  [ErrorCode.SUSPICIOUS_ACTIVITY]: 'This action was flagged for suspicious activity',
  [ErrorCode.REDEMPTION_FAILED]: 'Points redemption failed, please try again later',
  
  [ErrorCode.WALLET_CONNECTION_ERROR]: 'Could not connect to your wallet',
  [ErrorCode.WALLET_VERIFICATION_FAILED]: 'Wallet verification failed',
  [ErrorCode.WALLET_ALREADY_CONNECTED]: 'This wallet is already connected to another account',
  [ErrorCode.BLOCKCHAIN_ERROR]: 'Error communicating with the blockchain',
  [ErrorCode.TRANSACTION_FAILED]: 'The transaction failed to process',
  
  [ErrorCode.CONTENT_CREATION_FAILED]: 'Failed to create content, please try again',
  [ErrorCode.CONTENT_MODERATION_REQUIRED]: 'Your content requires moderation before publishing',
  [ErrorCode.CONTENT_TYPE_UNSUPPORTED]: 'This content type is not supported',
  
  [ErrorCode.USER_ALREADY_EXISTS]: 'A user with this identifier already exists',
  [ErrorCode.PROFILE_UPDATE_FAILED]: 'Failed to update profile, please try again',
  [ErrorCode.ACHIEVEMENT_CRITERIA_UNMET]: 'You do not meet the criteria for this achievement',
  
  [ErrorCode.WEBSOCKET_ERROR]: 'An error occurred with the real-time connection',
  [ErrorCode.WEBSOCKET_AUTH_FAILED]: 'Failed to authenticate real-time connection',
  [ErrorCode.WEBSOCKET_RATE_LIMIT]: 'Real-time connection rate limit exceeded',
  [ErrorCode.WEBSOCKET_CONNECTION_LIMIT]: 'Maximum real-time connections reached',
  
  [ErrorCode.OFFLINE_ERROR]: 'You appear to be offline. Some features may be unavailable',
  [ErrorCode.TIMEOUT_ERROR]: 'The request took too long to complete',
  [ErrorCode.PARSING_ERROR]: 'Could not parse the server response',
  [ErrorCode.BROWSER_SUPPORT_ERROR]: 'Your browser does not support this feature',
  [ErrorCode.DEVICE_CAPABILITY_ERROR]: 'Your device does not support this feature',
  [ErrorCode.RESOURCE_LOAD_ERROR]: 'Failed to load a required resource'
};

export const ErrorStatusCodes: Partial<Record<ErrorCode, number>> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404, 
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503
};

export const ErrorActions: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.NETWORK_ERROR]: 'Check your internet connection and try again',
  [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue',
  [ErrorCode.WALLET_CONNECTION_ERROR]: 'Make sure your wallet is unlocked and try again',
  [ErrorCode.INSUFFICIENT_POINTS]: 'Earn more points through platform activities',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Please wait a moment before trying again',
  [ErrorCode.OFFLINE_ERROR]: 'Connect to the internet to use all features',
  [ErrorCode.TIMEOUT_ERROR]: 'Please try again. If the problem persists, contact support'
};

export const ErrorRecoverable: Record<ErrorCode, boolean> = {
  [ErrorCode.VALIDATION_ERROR]: true,
  [ErrorCode.RESOURCE_NOT_FOUND]: false,
  [ErrorCode.UNAUTHORIZED]: true,
  [ErrorCode.FORBIDDEN]: false,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: true,
  [ErrorCode.SERVER_ERROR]: true,
  [ErrorCode.CONFLICT]: true,
  [ErrorCode.SERVICE_UNAVAILABLE]: true,
  [ErrorCode.CLIENT_ERROR]: true,
  [ErrorCode.NETWORK_ERROR]: true,
  
  [ErrorCode.POINTS_LIMIT_EXCEEDED]: false,
  [ErrorCode.INSUFFICIENT_POINTS]: false,
  [ErrorCode.POINTS_TRANSFER_FAILED]: true,
  [ErrorCode.SUSPICIOUS_ACTIVITY]: false,
  [ErrorCode.REDEMPTION_FAILED]: true,
  
  [ErrorCode.WALLET_CONNECTION_ERROR]: true,
  [ErrorCode.WALLET_VERIFICATION_FAILED]: true,
  [ErrorCode.WALLET_ALREADY_CONNECTED]: false,
  [ErrorCode.BLOCKCHAIN_ERROR]: true,
  [ErrorCode.TRANSACTION_FAILED]: true,
  
  [ErrorCode.CONTENT_CREATION_FAILED]: true,
  [ErrorCode.CONTENT_MODERATION_REQUIRED]: false,
  [ErrorCode.CONTENT_TYPE_UNSUPPORTED]: false,
  
  [ErrorCode.USER_ALREADY_EXISTS]: false,
  [ErrorCode.PROFILE_UPDATE_FAILED]: true,
  [ErrorCode.ACHIEVEMENT_CRITERIA_UNMET]: false,
  
  [ErrorCode.WEBSOCKET_ERROR]: true,
  [ErrorCode.WEBSOCKET_AUTH_FAILED]: true,
  [ErrorCode.WEBSOCKET_RATE_LIMIT]: true,
  [ErrorCode.WEBSOCKET_CONNECTION_LIMIT]: true,
  
  [ErrorCode.OFFLINE_ERROR]: true,
  [ErrorCode.TIMEOUT_ERROR]: true,
  [ErrorCode.PARSING_ERROR]: true,
  [ErrorCode.BROWSER_SUPPORT_ERROR]: false,
  [ErrorCode.DEVICE_CAPABILITY_ERROR]: false,
  [ErrorCode.RESOURCE_LOAD_ERROR]: true
};