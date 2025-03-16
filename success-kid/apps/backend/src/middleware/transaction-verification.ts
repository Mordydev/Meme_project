/**
 * Transaction Verification Middleware
 * 
 * Provides idempotency for write operations by tracking transaction IDs
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';
import crypto from 'crypto';

/**
 * Transaction verification options
 */
export interface TransactionVerificationOptions {
  /**
   * HTTP methods to verify
   */
  methods: string[];
  
  /**
   * Transaction ID header name
   */
  headerName: string;
  
  /**
   * Cache expiry in seconds
   */
  expiry: number;
}

// Default options
const defaultOptions: TransactionVerificationOptions = {
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  headerName: 'X-Transaction-ID',
  expiry: 300, // 5 minutes
};

/**
 * Transaction verification middleware factory
 */
export function createTransactionVerification(options: Partial<TransactionVerificationOptions> = {}) {
  // Merge with default options
  const opts: TransactionVerificationOptions = {
    ...defaultOptions,
    ...options,
  };
  
  // Return middleware function
  return async function transactionVerification(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    // Only apply to specified methods
    if (!opts.methods.includes(request.method)) {
      return;
    }
    
    // Get Redis client
    const redis = getRedisClient();
    
    // Generate transaction ID if not present
    if (!request.headers[opts.headerName.toLowerCase()]) {
      const transactionId = crypto.randomUUID();
      request.headers[opts.headerName.toLowerCase()] = transactionId;
    }
    
    const transactionId = request.headers[opts.headerName.toLowerCase()] as string;
    const redisKey = `transaction:${transactionId}`;
    
    try {
      // Check if transaction has been processed already (idempotency)
      const processed = await redis.get(redisKey);
      if (processed) {
        // Transaction already processed, return original response
        logger.info({ 
          transactionId, 
          path: request.url,
          method: request.method 
        }, 'Returning cached response for idempotent request');
        
        return reply.send(JSON.parse(processed));
      }
      
      // Store original send function to capture response
      const originalSend = reply.send;
      
      // Override send to record successful responses
      reply.send = function(payload) {
        // Only cache successful responses
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          const stringPayload = typeof payload === 'string' 
            ? payload 
            : JSON.stringify(payload);
          
          // Store response for idempotency
          redis.set(redisKey, stringPayload, 'EX', opts.expiry)
            .catch(err => request.log.error('Failed to store transaction', { err }));
          
          // Log transaction caching
          logger.debug({ 
            transactionId, 
            path: request.url,
            method: request.method,
            expiry: opts.expiry 
          }, 'Cached transaction response');
        }
        
        // Call original send
        return originalSend.call(this, payload);
      };
    } catch (error) {
      // Log error but continue - this should not block the request
      logger.error({ 
        err: error, 
        transactionId, 
        path: request.url, 
        method: request.method 
      }, 'Transaction verification error');
    }
  };
}

/**
 * Default export is middleware with default options
 */
export default createTransactionVerification();
