/**
 * Transaction Verification Middleware
 * 
 * Implements idempotency for API operations by tracking transaction IDs.
 * This prevents duplicate operations from being processed, particularly
 * important for points-related transactions and redemptions.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';
import crypto from 'crypto';

/**
 * Transaction verification middleware for idempotency
 */
export default async function transactionVerification(
  request: FastifyRequest, 
  reply: FastifyReply
): Promise<void> {
  // Only apply to write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return;
  }
  
  const redis = getRedisClient();
  
  // Generate transaction ID if not present
  let transactionId = request.headers['x-transaction-id'] as string;
  if (!transactionId) {
    transactionId = crypto.randomUUID();
    request.headers['x-transaction-id'] = transactionId;
  }
  
  // Log transaction for debugging
  request.log.debug('Transaction verification middleware', { 
    transactionId, 
    method: request.method,
    url: request.url
  });
  
  // Check if transaction has been processed already (idempotency)
  const cacheKey = `transaction:${transactionId}`;
  const processed = await redis.get(cacheKey);
  
  if (processed) {
    request.log.info('Transaction already processed, returning cached result', { 
      transactionId 
    });
    
    // Transaction already processed, return cached response
    const cachedResponse = JSON.parse(processed);
    
    // Return cached HTTP status code and body
    return reply
      .code(cachedResponse.statusCode)
      .headers(cachedResponse.headers || {})
      .send(cachedResponse.payload);
  }
  
  // Store original send function to capture response
  const originalSend = reply.send;
  
  // Override send to record successful responses
  reply.send = function(payload) {
    // Cache successful/idempotent responses
    const statusCode = reply.statusCode;
    if (
      // Cache successful responses (2xx, 3xx)
      (statusCode >= 200 && statusCode < 400) ||
      // Also cache client errors that would be consistent for the same request
      statusCode === 400 || // Bad request
      statusCode === 403 || // Forbidden
      statusCode === 404 || // Not found
      statusCode === 409    // Conflict
    ) {
      const responseToCache = {
        statusCode,
        headers: reply.getHeaders(),
        payload
      };
      
      // Store response for idempotency (10 minutes expiry)
      redis.set(cacheKey, JSON.stringify(responseToCache), 'EX', 600)
        .catch(err => request.log.error('Failed to store transaction', { err }));
    }
    
    // Call original send
    return originalSend.call(this, payload);
  };
}
