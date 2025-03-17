/**
 * Transaction Verification Middleware
 * 
 * Implements transaction verification for idempotent operations,
 * ensuring that identical API requests don't result in duplicate actions.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { getRedisClient } from '../lib/redis-client';
import { logger } from '../lib/logger';

/**
 * Transaction verification options
 */
export interface TransactionVerificationOptions {
  // HTTP methods to apply verification to
  methods: string[];
  
  // Cache expiry in seconds
  expiry: number;
  
  // Transaction ID header name
  headerName: string;
  
  // Routes to exclude (array of path prefixes or exact matches)
  excludeRoutes?: string[];
  
  // Key namespace for Redis cache
  namespace?: string;
  
  // Whether to log cache hits/misses for debugging
  debug?: boolean;
}

/**
 * Default transaction verification options
 */
const defaultOptions: TransactionVerificationOptions = {
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  expiry: 300, // 5 minutes
  headerName: 'X-Transaction-Id',
  excludeRoutes: ['/api/v1/health', '/docs', '/swagger'],
  namespace: 'transaction',
  debug: false
};

/**
 * Transaction verification middleware
 * 
 * Ensures operations with the same transaction ID are only processed once,
 * preventing duplicate operations and providing idempotence.
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param options Configuration options
 */
export async function transactionVerificationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  options: Partial<TransactionVerificationOptions> = {}
): Promise<void> {
  const config = { ...defaultOptions, ...options };
  
  // Skip verification for excluded routes
  if (config.excludeRoutes?.some(route => 
    request.url.startsWith(route) || 
    request.url === route ||
    (route.includes('*') && new RegExp(route.replace('*', '.*')).test(request.url))
  )) {
    return;
  }
  
  // Only apply to specified methods
  if (!config.methods.includes(request.method)) {
    return;
  }
  
  // Get Redis client
  const redis = getRedisClient();
  
  // Extract or generate transaction ID
  const headerKey = config.headerName.toLowerCase();
  const headers = request.headers as Record<string, string>;
  
  if (!headers[headerKey]) {
    // Generate a new transaction ID if not provided
    const transactionId = randomUUID();
    headers[headerKey] = transactionId;
    request.headers[headerKey] = transactionId;
    
    if (config.debug) {
      logger.debug('Generated transaction ID', { transactionId, url: request.url });
    }
  }
  
  const transactionId = headers[headerKey];
  const cacheKey = `${config.namespace}:${transactionId}`;
  
  try {
    // Check if transaction has already been processed
    const processed = await redis.get(cacheKey);
    
    if (processed) {
      // Transaction already processed, return cached response
      if (config.debug) {
        logger.debug('Transaction cache hit', { transactionId, url: request.url });
      }
      
      // Parse the stored response
      const cachedResponse = JSON.parse(processed);
      
      // Send the cached response
      return reply.code(cachedResponse.statusCode || 200).send(cachedResponse.payload);
    }
    
    if (config.debug) {
      logger.debug('Transaction cache miss', { transactionId, url: request.url });
    }
    
    // Store the original send function
    const originalSend = reply.send;
    
    // Override send function to cache successful responses
    reply.send = function(payload) {
      // Only cache successful responses (2xx status codes)
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        const cachePayload = {
          statusCode: reply.statusCode,
          payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
          headers: reply.getHeaders()
        };
        
        const stringPayload = JSON.stringify(cachePayload);
        
        // Store response for idempotency with expiry
        redis.set(cacheKey, stringPayload, 'EX', config.expiry)
          .catch(err => logger.error('Failed to store transaction', { 
            transactionId, 
            error: err.message 
          }));
          
        if (config.debug) {
          logger.debug('Stored transaction in cache', { 
            transactionId, 
            url: request.url,
            expires: `${config.expiry}s` 
          });
        }
      }
      
      // Call original send function
      return originalSend.call(this, payload);
    };
  } catch (error) {
    // In case of error checking/storing transaction, log but continue
    // This ensures the API still works even if transaction caching fails
    logger.error('Transaction verification error', { 
      transactionId, 
      error: error.message 
    });
  }
}

/**
 * Register transaction verification middleware with Fastify
 * 
 * @param fastify Fastify instance
 * @param options Configuration options
 */
export function registerTransactionVerification(
  fastify: any, 
  options: Partial<TransactionVerificationOptions> = {}
): void {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    await transactionVerificationMiddleware(request, reply, options);
  });
}

export default {
  middleware: transactionVerificationMiddleware,
  register: registerTransactionVerification,
};
