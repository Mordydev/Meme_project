/**
 * Rate Limiting Middleware
 * 
 * Middleware for rate limiting requests
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimitService, RateLimitConfig, RateLimitResult } from './service';
import { RateLimitExceededError } from '../../errors';
import { logger } from '../../lib/logger';

/**
 * Options for rate limit key generation
 */
export type KeyGenerator = (request: FastifyRequest) => string;

/**
 * Options for points consumption
 */
export type PointsGenerator = (request: FastifyRequest) => number;

/**
 * Options for rate limiting middleware
 */
export interface RateLimitOptions {
  config: RateLimitConfig;
  keyGenerator?: KeyGenerator;
  pointsGenerator?: PointsGenerator;
  skipIf?: (request: FastifyRequest) => boolean;
  responseGenerator?: (result: RateLimitResult) => { code: number; message: string };
}

/**
 * Default rate limit for typical endpoints
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  points: 60,          // 60 requests
  duration: 60,         // per 60 seconds
  keyPrefix: 'ratelimit:standard:'
};

/**
 * Strict rate limit for authentication endpoints
 */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  points: 10,          // 10 requests
  duration: 60,         // per 60 seconds
  blockDuration: 300,   // Block for 5 minutes if exceeded
  keyPrefix: 'ratelimit:auth:'
};

/**
 * Very strict rate limit for sensitive endpoints (password reset, etc.)
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  points: 5,           // 5 requests
  duration: 300,        // per 5 minutes
  blockDuration: 900,   // Block for 15 minutes if exceeded
  keyPrefix: 'ratelimit:strict:'
};

/**
 * Generate a key from IP address
 */
export const ipKeyGenerator: KeyGenerator = (request) => {
  return request.ip || 'unknown';
};

/**
 * Generate a key from user ID if authenticated, otherwise IP
 */
export const userOrIpKeyGenerator: KeyGenerator = (request) => {
  return request.user?.id || request.ip || 'unknown';
};

/**
 * Generate a key from IP and path
 */
export const ipAndPathKeyGenerator: KeyGenerator = (request) => {
  const path = request.routerPath || request.url;
  return `${request.ip}:${path}`;
};

/**
 * Adjust points based on the request method
 */
export const methodBasedPointsGenerator: PointsGenerator = (request) => {
  switch (request.method) {
    case 'GET':
    case 'HEAD':
      return 1;
    case 'PUT':
    case 'DELETE':
      return 2;
    case 'POST':
    case 'PATCH':
      return 3;
    default:
      return 1;
  }
};

/**
 * Create rate limiting middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    config,
    keyGenerator = ipKeyGenerator,
    pointsGenerator = () => 1,
    skipIf = () => false,
    responseGenerator = (result) => ({
      code: 429,
      message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetTime / 1000)} seconds.`
    })
  } = options;
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Skip rate limiting if the condition is met
      if (skipIf(request)) {
        return;
      }
      
      // Generate key for this request
      const key = keyGenerator(request);
      
      // Determine points to consume
      const points = pointsGenerator(request);
      
      // Apply rate limit
      const result = await rateLimitService.consume(key, points, config);
      
      // Add rate limit headers
      reply.header('X-RateLimit-Limit', config.points);
      reply.header('X-RateLimit-Remaining', result.remaining);
      reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      
      // If blocked, add Retry-After header
      if (result.blocked && result.blockExpires) {
        const retryAfterSeconds = Math.ceil((result.blockExpires - Date.now()) / 1000);
        reply.header('Retry-After', retryAfterSeconds);
      }
      
      // If rate limit is exceeded, throw error
      if (!result.success) {
        const { code, message } = responseGenerator(result);
        throw new RateLimitExceededError(message, code);
      }
    } catch (error) {
      // Only re-throw if it's our rate limit error
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      
      // Log other errors but don't block the request
      logger.error('Rate limiting error', { error });
    }
  };
}

/**
 * Standard rate limiter for general endpoints
 */
export const standardRateLimiter = createRateLimiter({
  config: DEFAULT_RATE_LIMIT,
  keyGenerator: ipKeyGenerator
});

/**
 * Authentication rate limiter for login, signup, etc.
 */
export const authRateLimiter = createRateLimiter({
  config: AUTH_RATE_LIMIT,
  keyGenerator: ipKeyGenerator
});

/**
 * Strict rate limiter for sensitive operations like password reset
 */
export const strictRateLimiter = createRateLimiter({
  config: STRICT_RATE_LIMIT,
  keyGenerator: ipKeyGenerator
});

/**
 * API rate limiter that varies by HTTP method
 */
export const apiRateLimiter = createRateLimiter({
  config: DEFAULT_RATE_LIMIT,
  keyGenerator: ipAndPathKeyGenerator,
  pointsGenerator: methodBasedPointsGenerator
});

/**
 * Skip rate limiting for trusted networks
 */
export function skipTrustedNetworks(trustedIps: string[] = []) {
  return (request: FastifyRequest) => {
    return trustedIps.includes(request.ip);
  };
}

/**
 * Rate limiting middleware factory for Fastify
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const limiter = createRateLimiter(options);
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await limiter(request, reply);
  };
}
