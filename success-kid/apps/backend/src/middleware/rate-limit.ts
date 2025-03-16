import { FastifyRequest, FastifyReply } from 'fastify';
import { redisClient } from '../lib/redis-client';
import { RateLimitExceededError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  max: number;                // Maximum number of requests allowed
  timeWindow: string | number; // Time window in seconds or human-readable format (e.g., '1 minute')
  keyPrefix?: string;         // Redis key prefix
  keyGenerator?: (request: FastifyRequest) => string; // Function to generate rate limit key
  errorMessage?: string;      // Custom error message
}

/**
 * Parse time window from string or number
 * Supports formats like '1 minute', '5 hours', etc.
 * 
 * @param timeWindow Time window string or seconds
 * @returns Time window in seconds
 */
function parseTimeWindow(timeWindow: string | number): number {
  if (typeof timeWindow === 'number') {
    return timeWindow;
  }
  
  const match = timeWindow.match(/^(\d+)\s*(\w+)$/);
  
  if (!match) {
    return 60; // Default to 60 seconds
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'second':
    case 'seconds':
      return value;
    case 'minute':
    case 'minutes':
      return value * 60;
    case 'hour':
    case 'hours':
      return value * 60 * 60;
    case 'day':
    case 'days':
      return value * 24 * 60 * 60;
    default:
      return 60; // Default to 60 seconds
  }
}

/**
 * Rate limiting middleware factory
 * 
 * @param options Rate limiting options
 * @returns Middleware function
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    max,
    timeWindow,
    keyPrefix = 'ratelimit:',
    keyGenerator = (request) => request.ip,
    errorMessage = 'Rate limit exceeded'
  } = options;
  
  const windowSeconds = parseTimeWindow(timeWindow);
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = `${keyPrefix}${keyGenerator(request)}`;
    
    try {
      // Get current usage count
      const countStr = await redisClient.get(key);
      const count = countStr ? parseInt(countStr, 10) : 0;
      
      // Check if limit exceeded
      if (count >= max) {
        throw new RateLimitExceededError(errorMessage);
      }
      
      // Increment counter (or set if first request)
      if (count === 0) {
        await redisClient.set(key, '1', windowSeconds);
      } else {
        await redisClient.client.incr(key);
      }
      
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', Math.max(0, max - count - 1));
      
      // Get TTL for the key
      const ttl = await redisClient.client.ttl(key);
      reply.header('X-RateLimit-Reset', ttl);
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      
      // Log redis errors but don't block the request
      logger.error('Rate limit error', { error });
    }
  };
}
