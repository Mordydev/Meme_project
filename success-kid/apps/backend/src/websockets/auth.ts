/**
 * WebSocket Authentication Services
 * 
 * Handles authentication for WebSocket connections using JWT tokens.
 * Includes token refresh support for long-lived connections.
 */
import { FastifyRequest } from 'fastify';
import { verifyClerkJWT } from '../lib/clerk';
import { logger } from '../lib/logger';
import { Redis } from 'ioredis';
import { getRedisClient } from '../lib/db-client';

// Token cache for faster validation
interface TokenCacheEntry {
  userId: string;
  expiresAt: number; // Timestamp in milliseconds
}

// In-memory token cache with TTL
const tokenCache = new Map<string, TokenCacheEntry>();

// Redis client for distributed token cache
const redis = getRedisClient();
const TOKEN_CACHE_PREFIX = 'ws:token:';
const TOKEN_CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Extract and validate authentication token from WebSocket request
 * 
 * @param request Fastify request with WebSocket
 * @returns User ID if authenticated, null if not
 */
export async function authenticateWebSocketConnection(request: FastifyRequest): Promise<string | null> {
  try {
    // Extract token from query parameter or headers
    const token = extractToken(request);
    
    if (!token) {
      logger.warn('WebSocket connection missing authentication token', {
        ip: request.ip,
        path: request.url
      });
      return null;
    }
    
    // Validate token and extract user ID
    const userId = await validateToken(token);
    
    if (userId) {
      // Store token in distributed cache for refresh reference
      // This allows recognizing the token across server instances
      await storeTokenInCache(token, userId);
    }
    
    return userId;
  } catch (error) {
    logger.error('WebSocket authentication error', { error });
    return null;
  }
}

/**
 * Extract token from request
 * 
 * @param request Fastify request
 * @returns Token if found, null if not
 */
function extractToken(request: FastifyRequest): string | null {
  // Extract token from query parameter (preferred for WebSockets)
  const token = request.query.token as string;
  
  // If no token in query, try Authorization header
  if (!token && request.headers.authorization) {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
  }
  
  return token || null;
}

/**
 * Validate a JWT token and extract user ID
 * 
 * @param token JWT token
 * @returns User ID if valid, null if not
 */
export async function validateToken(token: string): Promise<string | null> {
  try {
    // Check in-memory cache first for performance
    const cachedEntry = tokenCache.get(token);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return cachedEntry.userId;
    }
    
    // Then check Redis cache for distributed cache
    const cachedUserId = await redis.get(`${TOKEN_CACHE_PREFIX}${token}`);
    if (cachedUserId) {
      // Update in-memory cache from Redis
      const ttl = await redis.ttl(`${TOKEN_CACHE_PREFIX}${token}`);
      if (ttl > 0) {
        const expiresAt = Date.now() + (ttl * 1000);
        tokenCache.set(token, { userId: cachedUserId, expiresAt });
        return cachedUserId;
      }
    }
    
    // Verify with Clerk if not in cache
    const user = await verifyClerkJWT(token);
    
    if (user) {
      // Calculate token expiration from JWT claims if available
      const expiresAt = getTokenExpiration(token);
      
      // Cache the token validation result
      tokenCache.set(token, { userId: user.id, expiresAt });
      
      return user.id;
    }
    
    return null;
  } catch (error) {
    logger.error('Token validation error', { error });
    
    // Clear token from cache if validation fails
    tokenCache.delete(token);
    await redis.del(`${TOKEN_CACHE_PREFIX}${token}`);
    
    return null;
  }
}

/**
 * Store token in distributed cache for refresh reference
 * 
 * @param token JWT token
 * @param userId User ID
 */
async function storeTokenInCache(token: string, userId: string): Promise<void> {
  try {
    // Calculate token expiration
    const expiresAt = getTokenExpiration(token);
    const ttl = Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
    
    // Store in Redis with TTL
    await redis.setex(`${TOKEN_CACHE_PREFIX}${token}`, ttl, userId);
    
    // Store in local cache
    tokenCache.set(token, { userId, expiresAt });
  } catch (error) {
    logger.error('Failed to store token in cache', { error });
  }
}

/**
 * Get token expiration time from JWT
 * 
 * @param token JWT token
 * @returns Expiration timestamp in milliseconds
 */
function getTokenExpiration(token: string): number {
  try {
    // Parse token to get expiration claim
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    // Use exp claim if available, or default to 1 hour
    const expSeconds = payload.exp || (Math.floor(Date.now() / 1000) + 3600);
    
    return expSeconds * 1000; // Convert to milliseconds
  } catch (error) {
    // Default to 1 hour from now if parsing fails
    return Date.now() + 3600000;
  }
}

/**
 * Verify token synchronously for WebSocket message authentication
 * 
 * Uses the token cache for performance with fast lookup
 * 
 * @param token JWT token
 * @returns User ID if cached and valid, null if not
 */
export function checkCachedToken(token: string): string | null {
  // Check in-memory cache first for performance
  const cachedEntry = tokenCache.get(token);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.userId;
  }
  
  return null;
}

/**
 * Generate a refresh token response
 * 
 * @param oldToken Old token
 * @returns Refresh response object
 */
export function generateRefreshResponse(oldToken: string): { type: string; payload: any } {
  return {
    type: 'auth.refresh',
    payload: {
      message: 'Token expiring soon, please refresh',
      expiresIn: getTokenRemainingTime(oldToken),
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Get remaining time for token in seconds
 * 
 * @param token JWT token
 * @returns Remaining time in seconds, or 0 if expired
 */
function getTokenRemainingTime(token: string): number {
  const cachedEntry = tokenCache.get(token);
  if (cachedEntry) {
    const remainingMs = cachedEntry.expiresAt - Date.now();
    return Math.max(0, Math.floor(remainingMs / 1000));
  }
  
  // Try to parse from token if not in cache
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expSeconds = payload.exp || 0;
    const remainingSeconds = expSeconds - Math.floor(Date.now() / 1000);
    return Math.max(0, remainingSeconds);
  } catch (error) {
    return 0;
  }
}

/**
 * Check if a token is about to expire
 * 
 * @param token JWT token
 * @param thresholdSeconds Threshold in seconds (default: 5 minutes)
 * @returns True if token is about to expire, false otherwise
 */
export function isTokenAboutToExpire(token: string, thresholdSeconds: number = 300): boolean {
  const remainingTime = getTokenRemainingTime(token);
  return remainingTime > 0 && remainingTime <= thresholdSeconds;
}

/**
 * Clean up expired tokens from cache
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    // Clean up in-memory cache
    const now = Date.now();
    for (const [token, entry] of tokenCache.entries()) {
      if (entry.expiresAt <= now) {
        tokenCache.delete(token);
      }
    }
    
    // Note: Redis keys will expire automatically via TTL
    
    logger.debug('Cleaned up expired tokens', { 
      remainingCount: tokenCache.size 
    });
  } catch (error) {
    logger.error('Failed to clean up expired tokens', { error });
  }
}

// Set up periodic cleanup
setInterval(cleanupExpiredTokens, 60000); // Run every minute