/**
 * Shared API Types
 * 
 * This file defines shared types for API requests and responses between frontend and backend.
 * It ensures type consistency across the application.
 */

/**
 * Standard API success response structure as defined in backend guidelines
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Standard API error response structure as defined in backend guidelines
 */
export interface ApiErrorResponse {
  data: null;
  meta: {
    timestamp: string;
    requestId: string;
  };
  errors: Array<{
    code: string;
    message: string;
    details?: any;
  }>;
}

/**
 * Standard error codes as defined in backend guidelines
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
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET',
  
  // Network and system errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED'
}

/**
 * Standard WebSocket message structure
 */
export interface WebSocketMessage {
  type: string;
  id?: string;
  payload?: any;
}

/**
 * WebSocket event types
 */
export enum WebSocketEventType {
  // System events
  CONNECTED = 'connected',
  RECONNECT_SUCCESS = 'reconnect:success',
  RECONNECT_FAILED = 'reconnect:failed',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
  
  // Subscription events
  SUBSCRIBE = 'subscribe',
  SUBSCRIBE_CONFIRMATION = 'subscribe:confirmation',
  UNSUBSCRIBE = 'unsubscribe',
  UNSUBSCRIBE_CONFIRMATION = 'unsubscribe:confirmation',
  
  // Business events
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  CONTENT_CREATED = 'content.created',
  NOTIFICATION_NEW = 'notification.new',
  MARKET_UPDATE = 'market.update',
  TRANSACTION_NEW = 'transaction.new',
  MILESTONE_REACHED = 'milestone.reached',
  PRESENCE_UPDATED = 'presence.updated'
}

/**
 * API endpoints - Keep in sync with backend implementations
 */
export enum ApiEndpoints {
  // Auth endpoints
  AUTH_REGISTER = '/api/v1/auth/register',
  AUTH_LOGIN = '/api/v1/auth/login',
  
  // User endpoints
  USER_ME = '/api/v1/users/me',
  USER_PROFILE = '/api/v1/users/:id/profile',
  
  // Content endpoints
  CONTENT_LIST = '/api/v1/content',
  CONTENT_GET = '/api/v1/content/:id',
  CONTENT_COMMENTS = '/api/v1/content/:id/comments',
  
  // Points endpoints
  POINTS_HISTORY = '/api/v1/points/history',
  POINTS_AWARD = '/api/v1/points/award',
  POINTS_REDEEM = '/api/v1/points/redeem',
  
  // Wallet endpoints
  WALLET_CONNECT = '/api/v1/wallet/connect',
  WALLET_VERIFY = '/api/v1/wallet/verify',
  
  // Market endpoints
  MARKET_OVERVIEW = '/api/v1/market/overview',
  MARKET_TRANSACTIONS = '/api/v1/market/transactions',
  
  // Achievement endpoints
  ACHIEVEMENTS_LIST = '/api/v1/achievements',
  ACHIEVEMENTS_USER = '/api/v1/achievements/user',
  
  // Leaderboard endpoints
  LEADERBOARD = '/api/v1/leaderboard',
  
  // Referral endpoints
  REFERRALS = '/api/v1/referrals',
  REFERRALS_CREATE = '/api/v1/referrals/create'
}

/**
 * Type definitions for API request payloads
 */
export namespace ApiRequests {
  export interface RegisterUser {
    email: string;
    password: string;
    displayName: string;
  }
  
  export interface LoginUser {
    email: string;
    password: string;
  }
  
  export interface CreateContent {
    type: 'text' | 'image' | 'link' | 'poll';
    contentText: string;
    mediaUrls?: string[];
    tags?: string[];
  }
  
  export interface AwardPoints {
    userId: string;
    amount: number;
    source: string;
    referenceId?: string;
    description?: string;
  }
  
  export interface RedeemPoints {
    amount: number;
    walletAddress?: string;
  }
  
  export interface ConnectWallet {
    walletAddress: string;
    signature: string;
    message: string;
  }
}

/**
 * Type definitions for API response data structures
 */
export namespace ApiResponses {
  export interface AuthSuccess {
    user: {
      id: string;
      email: string;
      displayName: string;
    };
    token: string;
  }
  
  export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    level: number;
    title?: string;
    joinedAt: string;
    points: number;
    walletConnected: boolean;
  }
  
  export interface PointsBalance {
    balance: number;
    totalEarned: number;
    lastUpdated: string;
  }
  
  export interface PointsHistory {
    transactions: Array<{
      id: string;
      amount: number;
      source: string;
      timestamp: string;
      description?: string;
    }>;
  }
  
  export interface MarketOverview {
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
    nextMilestone: {
      target: number;
      progress: number;
      percentage: number;
    };
  }
  
  export interface WalletConnection {
    address: string;
    isVerified: boolean;
    connectedAt: string;
    balance?: number;
  }
}
