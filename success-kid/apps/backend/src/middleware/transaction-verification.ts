import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import fp from 'fastify-plugin';

// Extend FastifyRequest to include transactionId
declare module 'fastify' {
  interface FastifyRequest {
    transactionId: string;
  }
}

/**
 * Middleware for transaction verification to ensure idempotency
 * This is essential for sensitive operations such as points transactions
 */
export default fp(async (fastify) => {
  // Get redis instance from fastify
  const redis = fastify.redis;

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only apply to write operations
    if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
      return;
    }
    
    // Generate transaction ID if not present
    let transactionId = request.headers['x-transaction-id'] as string;
    if (!transactionId) {
      transactionId = randomUUID();
      request.headers['x-transaction-id'] = transactionId;
    }
    
    // Attach to request for logging and reference
    request.transactionId = transactionId;
    
    // If Redis is available, check for idempotency
    if (redis) {
      try {
        const processed = await redis.get(`transaction:${transactionId}`);
        if (processed) {
          // Transaction already processed, return original response
          return reply.code(200).send(JSON.parse(processed));
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
            
            // Store response for idempotency (5 minute expiry)
            redis.set(`transaction:${transactionId}`, stringPayload, 'EX', 300)
              .catch(err => request.log.error('Failed to store transaction', { err }));
          }
          
          // Call original send
          return originalSend.call(this, payload);
        };
      } catch (error) {
        // If Redis fails, log but proceed (fail open)
        request.log.error('Transaction verification failed', { error });
      }
    } else {
      // If Redis is not available, just log a warning
      request.log.warn('Redis not available for transaction verification');
    }
  });
});