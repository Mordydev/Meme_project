/**
 * WebSocket Security
 * 
 * Enhanced security features for WebSocket connections, including
 * authentication, authorization, and rate limiting.
 */
import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { Redis } from 'ioredis';
import { logger } from '../lib/logger';
import { WebSocketErrorType, sendErrorResponse } from './error-handling';

/**
 * JWT verification interface
 */
interface JwtVerifier {
  verifyToken(token: string): Promise<any>;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  
  /** Time window in seconds */
  window: number;
  
  /** Key prefix */
  prefix?: string;
}

/**
 * Default rate limit config
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  connection: {
    limit: 10,
    window: 60,
    prefix: 'ws:connect'
  },
  message: {
    limit: 60,
    window: 60,
    prefix: 'ws:message'
  },
  subscription: {
    limit: 20,
    window: 60,
    prefix: 'ws:subscribe'
  }
};

/**
 * Connection limits per user
 */
export interface ConnectionLimits {
  /** Maximum connections per user */
  maxConnectionsPerUser: number;
  
  /** Maximum subscriptions per connection */
  maxSubscriptionsPerConnection: number;
  
  /** Maximum message size in bytes */
  maxMessageSize: number;
}

/**
 * Default connection limits
 */
const DEFAULT_CONNECTION_LIMITS: ConnectionLimits = {
  maxConnectionsPerUser: 5,
  maxSubscriptionsPerConnection: 50,
  maxMessageSize: 1024 * 100 // 100KB
};

/**
 * WebSocket security service for enhanced security features
 */
export class WebSocketSecurity {
  private redis: Redis;
  private jwtVerifier: JwtVerifier;
  private rateLimits: Record<string, RateLimitConfig>;
  private connectionLimits: ConnectionLimits;
  
  /**
   * Create WebSocket security service
   * @param redis Redis client for rate limiting
   * @param jwtVerifier JWT verification service
   * @param rateLimits Custom rate limit configuration
   * @param connectionLimits Custom connection limits
   */
  constructor(
    redis: Redis,
    jwtVerifier: JwtVerifier,
    rateLimits: Record<string, Partial<RateLimitConfig>> = {},
    connectionLimits: Partial<ConnectionLimits> = {}
  ) {
    this.redis = redis;
    this.jwtVerifier = jwtVerifier;
    
    // Merge custom rate limits with defaults
    this.rateLimits = { ...DEFAULT_RATE_LIMITS };
    Object.entries(rateLimits).forEach(([key, config]) => {
      this.rateLimits[key] = { ...DEFAULT_RATE_LIMITS[key], ...config };
    });
    
    // Merge connection limits with defaults
    this.connectionLimits = { ...DEFAULT_CONNECTION_LIMITS, ...connectionLimits };
  }
  
  /**
   * Authenticate WebSocket connection
   * @param request Fastify request
   * @param socket WebSocket connection
   * @returns Authentication result with user ID
   */
  async authenticateConnection(
    request: FastifyRequest,
    socket: WebSocket
  ): Promise<{ authenticated: boolean; userId?: string; roles?: string[] }> {
    try {
      // Get authentication token from request
      const token = this.extractToken(request);
      
      if (!token) {
        // Anonymous connection - allowed but limited
        logger.debug('Anonymous WebSocket connection');
        return { authenticated: false };
      }
      
      // Verify token
      const decoded = await this.jwtVerifier.verifyToken(token);
      
      if (!decoded || !decoded.sub) {
        sendErrorResponse(
          socket,
          WebSocketErrorType.AUTH_INVALID,
          'Invalid authentication token',
          { shouldClose: true, code: 1008 }
        );
        return { authenticated: false };
      }
      
      // Extract user info
      const userId = decoded.sub;
      const roles = decoded.roles || [];
      
      logger.debug('Authenticated WebSocket connection', { userId });
      
      return {
        authenticated: true,
        userId,
        roles
      };
    } catch (error) {
      // Handle different error types
      if (error.name === 'TokenExpiredError') {
        sendErrorResponse(
          socket,
          WebSocketErrorType.AUTH_EXPIRED,
          'Authentication token expired',
          { shouldClose: true, code: 1008 }
        );
      } else {
        sendErrorResponse(
          socket,
          WebSocketErrorType.AUTH_FAILED,
          'Authentication failed',
          { shouldClose: true, code: 1008 }
        );
      }
      
      logger.warn('WebSocket authentication error', { error });
      return { authenticated: false };
    }
  }
  
  /**
   * Check if connection limit is exceeded for a user
   * @param userId User ID
   * @param currentCount Current connection count
   * @returns Whether limit is exceeded
   */
  isConnectionLimitExceeded(userId: string, currentCount: number): boolean {
    return currentCount >= this.connectionLimits.maxConnectionsPerUser;
  }
  
  /**
   * Check if subscription limit is exceeded
   * @param subscriptionCount Subscription count
   * @returns Whether limit is exceeded
   */
  isSubscriptionLimitExceeded(subscriptionCount: number): boolean {
    return subscriptionCount >= this.connectionLimits.maxSubscriptionsPerConnection;
  }
  
  /**
   * Check if message size limit is exceeded
   * @param messageSize Message size in bytes
   * @returns Whether limit is exceeded
   */
  isMessageSizeLimitExceeded(messageSize: number): boolean {
    return messageSize > this.connectionLimits.maxMessageSize;
  }
  
  /**
   * Check if user is allowed to access a channel
   * @param userId User ID
   * @param roles User roles
   * @param channel Channel name
   * @returns Whether access is allowed
   */
  async canAccessChannel(
    userId: string,
    roles: string[] = [],
    channel: string
  ): Promise<boolean> {
    // Allow user's own channels
    if (channel === `user:${userId}` || channel.startsWith(`user:${userId}:`)) {
      return true;
    }
    
    // Allow public channels
    if (channel === 'public:announcements' || 
        channel === 'market:updates' ||
        channel === 'content:new') {
      return true;
    }
    
    // Check role-based access
    if (channel.startsWith('role:')) {
      const requiredRole = channel.substring(5);
      return roles.includes(requiredRole) || roles.includes('admin');
    }
    
    // Disallow other private channels
    if (channel.startsWith('user:') && !channel.startsWith(`user:${userId}`)) {
      return false;
    }
    
    // Default allow policy
    return true;
  }
  
  /**
   * Apply rate limit for an action
   * @param type Action type
   * @param key Resource key (user ID, IP, etc.)
   * @returns Whether action is allowed
   */
  async applyRateLimit(type: string, key: string): Promise<boolean> {
    const config = this.rateLimits[type];
    
    if (!config) {
      // No rate limit for this action type
      return true;
    }
    
    const redisKey = `${config.prefix}:${key}`;
    
    try {
      // Get current count
      const count = await this.redis.incr(redisKey);
      
      // Set expiry if first request
      if (count === 1) {
        await this.redis.expire(redisKey, config.window);
      }
      
      // Check if limit exceeded
      if (count > config.limit) {
        logger.warn(`Rate limit exceeded for ${type}`, { key, count, limit: config.limit });
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Rate limit check error', { error, type, key });
      
      // Allow the request if Redis fails (fail open for reliability)
      return true;
    }
  }
  
  /**
   * Extract authentication token from request
   * @param request Fastify request
   * @returns Authentication token or null
   */
  private extractToken(request: FastifyRequest): string | null {
    // Try different token locations
    
    // 1. Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // 2. Query parameter
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
      return tokenParam;
    }
    
    // 3. Cookie
    const cookies = request.cookies;
    if (cookies && cookies.auth_token) {
      return cookies.auth_token;
    }
    
    // No token found
    return null;
  }
}
