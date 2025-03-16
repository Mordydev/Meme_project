/**
 * Transaction Verification Middleware
 * 
 * Implements transaction verification for idempotent operations,
 * ensuring that identical API requests don't result in duplicate actions.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { getRedisClient } from '../lib/db-client';
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
}

/**
 * Default transaction verification options
 */
const defaultOptions: TransactionVerificationOptions = {
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  expiry: 300, // 5 minutes
  headerName: 'X-Transaction-Id',
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
  }
  
  const transactionId = headers[headerKey];
  const cacheKey = `transaction:${transactionId}`;
  
  try {
    // Check if transaction has already been processed
    const processed = await redis.get(cacheKey);
    
    if (processed) {
      // Transaction already processed, return cached response
      logger.debug('Transaction already processed', { transactionId });
      
      // Parse the stored response
      const cachedResponse = JSON.parse(processed);
      
      // Send the cached response
      return reply.send(cachedResponse);
    }
    
    // Store the original send function
    const originalSend = reply.send;
    
    // Override send function to cache successful responses
    reply.send = function(payload) {
      // Only cache successful responses (2xx status codes)
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        const stringPayload = typeof payload === 'string' 
          ? payload 
          : JSON.stringify(payload);
        
        // Store response for idempotency with expiry
        redis.set(cacheKey, stringPayload, 'EX', config.expiry)
          .catch(err => logger.error('Failed to store transaction', { 
            transactionId, 
            error: err.message 
          }));
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
