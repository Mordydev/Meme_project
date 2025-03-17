/**
 * Shared API Types for Success Kid Community Platform
 * 
 * This package provides type definitions shared between frontend and backend
 * to ensure consistency in API contracts.
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  data: T | null;
  meta: {
    timestamp: string;
    requestId: string;
    [key: string]: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  errors?: ApiError[];
}

/**
 * Standard error format for API responses
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Error codes enum - shared between frontend and backend
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
  
  // User-specific errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET'
}

/**
 * WebSocket events enum - shared for client-server communication
 */
export enum WebSocketEventType {
  // System events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
  
  // User events
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_ACTIVITY = 'user:activity',
  USER_TYPING = 'user:typing',
  
  // Points events
  POINTS_AWARDED = 'points:awarded',
  POINTS_REDEEMED = 'points:redeemed',
  
  // Content events
  CONTENT_CREATED = 'content:created',
  CONTENT_UPDATED = 'content:updated',
  CONTENT_DELETED = 'content:deleted',
  CONTENT_REACTION = 'content:reaction',
  CONTENT_COMMENT = 'content:comment',
  
  // Achievement events
  ACHIEVEMENT_UNLOCKED = 'achievement:unlocked',
  LEVEL_UP = 'level:up',
  BADGE_EARNED = 'badge:earned',
  
  // Notifications
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  
  // Market events
  MARKET_UPDATE = 'market:update',
  TRANSACTION_NEW = 'transaction:new',
  MILESTONE_REACHED = 'milestone:reached'
}

/**
 * Standard WebSocket message format
 */
export interface WebSocketMessage {
  type: WebSocketEventType | string;
  payload?: any;
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  [key: string]: any;
}

/**
 * Standard query parameters
 */
export interface QueryParams extends PaginationParams {
  sort?: SortParams;
  filter?: FilterParams;
  search?: string;
}

// Export user-related interfaces
export * from './user';

// Export points-related interfaces
export * from './points';

// Export content-related interfaces
export * from './content';

// Export wallet-related interfaces
export * from './wallet';
