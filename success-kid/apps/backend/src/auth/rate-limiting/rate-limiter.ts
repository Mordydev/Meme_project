/**
 * Rate Limiter
 * 
 * Implements rate limiting for authentication and security-sensitive endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { TooManyRequestsError } from '../../errors';

// Default rate limits for different operations
export const RATE_LIMITS = {
  // Auth operations
  login: { points: 10, duration: 60 * 5 }, // 10 attempts per 5 minutes
  register: { points: 5, duration: 60 * 10 }, // 5 attempts per 10 minutes
  resetPassword: { points: 3, duration: 60 * 60 }, // 3 attempts per hour
  verifyEmail: { points: 5, duration: 60 * 15 }, // 5 attempts per 15 minutes
  
  // API operations
  apiStandard: { points: 60, duration: 60 }, // 60 requests per minute
  apiBurst: { points: 180, duration: 60 }, // 180 requests per minute (for batch operations)
  
  // Sensitive operations
  walletConnection: { points: 5, duration: 60 * 10 }, // 5 attempts per 10 minutes
  pointsRedemption: { points: 10, duration: 60 * 60 }, // 10 attempts per hour
  contentCreation: { points: 20, duration: 60 * 15 }, // 20 attempts per 15 minutes
  
  // Fallback default
  default: { points: 30, duration: 60 }, // 30 requests per minute
};

/**
 * Check rate limit for a specific key
 */
export async function checkRateLimit(
  key: string,
  { points, duration }: { points: number; duration: number }
): Promise<{ limited: boolean; remaining: number; resetAfter: number }> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const rateKey = `ratelimit:${key}`;
    
    // Get current usage window
    let [currentCount, windowStart] = await redis.hmget(rateKey, 'count', 'start') as [string | null, string | null];
    
    // If no current window or window has expired, create a new one
    if (!currentCount || !windowStart || parseInt(windowStart) + duration < now) {
      await redis.hmset(rateKey, {
        'count': '1',
        'start': now.toString()
      });
      await redis.expire(rateKey, duration);
      
      return {
        limited: false,
        remaining: points - 1,
        resetAfter: duration
      };
    }
    
    // Check if limit exceeded
    const count = parseInt(currentCount);
    const windowStartTime = parseInt(windowStart);
    const resetAfter = windowStartTime + duration - now;
    
    if (count >= points) {
      return {
        limited: true,
        remaining: 0,
        resetAfter
      };
    }
    
    // Increment usage
    await redis.hincrby(rateKey, 'count', 1);
    
    return {
      limited: false,
      remaining: points - count - 1,
      resetAfter
    };
  } catch (error) {
    // If Redis fails, log but allow the request (fail open for critical operations)
    logger.error('Rate limit check failed', { error, key });
    
    return {
      limited: false,
      remaining: 1,
      resetAfter: 0
    };
  }
}

/**
 * Generic rate limiting middleware
 */
export function rateLimitMiddleware(
  limiterOptions: { 
    keyGenerator?: (request: FastifyRequest) => string;
    points?: number;
    duration?: number;
    errorMessage?: string;
  } = {}
) {
  const {
    keyGenerator = (request) => request.ip,
    points,
    duration,
    errorMessage = 'Too many requests, please try again later.'
  } = limiterOptions;
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get rate limit key
      const key = keyGenerator(request);
      
      // Get applicable limits from options or defaults
      const limitConfig = {
        points: points || RATE_LIMITS.default.points,
        duration: duration || RATE_LIMITS.default.duration
      };
      
      // Check rate limit
      const { limited, remaining, resetAfter } = await checkRateLimit(key, limitConfig);
      
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', limitConfig.points);
      reply.header('X-RateLimit-Remaining', remaining);
      reply.header('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + resetAfter);
      
      if (limited) {
        throw new TooManyRequestsError(errorMessage);
      }
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        throw error;
      }
      
      // If rate limiting fails, log but allow the request
      logger.error('Rate limiting error', { error });
    }
  };
}

/**
 * Create a specialized rate limiter for specific operations
 */
export function createRateLimiter(
  operation: keyof typeof RATE_LIMITS,
  customOptions: Partial<{
    keyGenerator: (request: FastifyRequest) => string;
    errorMessage: string;
  }> = {}
) {
  const limits = RATE_LIMITS[operation] || RATE_LIMITS.default;
  
  return rateLimitMiddleware({
    points: limits.points,
    duration: limits.duration,
    ...customOptions
  });
}

/**
 * Create a login rate limiter
 */
export function loginRateLimiter() {
  return createRateLimiter('login', {
    // Use email or username as key if available, otherwise IP
    keyGenerator: (request: FastifyRequest) => {
      const body = request.body as any;
      const identifier = body?.email || body?.username || request.ip;
      return `login:${identifier}`;
    },
    errorMessage: 'Too many login attempts. Please try again later.'
  });
}

/**
 * Create a wallet connection rate limiter
 */
export function walletConnectionRateLimiter() {
  return createRateLimiter('walletConnection', {
    keyGenerator: (request: FastifyRequest) => {
      const userId = request.user?.id || 'anonymous';
      return `wallet:${userId}`;
    },
    errorMessage: 'Too many wallet connection attempts. Please try again later.'
  });
}

/**
 * Create a points redemption rate limiter
 */
export function pointsRedemptionRateLimiter() {
  return createRateLimiter('pointsRedemption', {
    keyGenerator: (request: FastifyRequest) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error('User ID required for points redemption');
      }
      return `redemption:${userId}`;
    },
    errorMessage: 'Too many redemption attempts. Please try again later.'
  });
}
