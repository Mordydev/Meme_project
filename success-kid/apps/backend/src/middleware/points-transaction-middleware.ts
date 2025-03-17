/**
 * Points Transaction Middleware
 * 
 * Enforces transaction verification, validation, and security for
 * points-related API endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';
import { getRedisClient } from '../lib/db-client';
import { PointsSource } from '../models/user-points';

interface PointsRequestBody {
  userId: string;
  amount: number;
  source: PointsSource;
  referenceId?: string;
}

/**
 * Rate limiting middleware for points-related endpoints
 */
export async function pointsRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.id || request.ip;
  const redis = getRedisClient();
  
  // Different rate limits based on endpoint
  let points = 10; // Default points per minute
  let duration = 60; // Default window in seconds
  
  const endpoint = request.routerPath;
  
  // Customize limits based on endpoint sensitivity
  if (endpoint.includes('/award')) {
    points = 20; // Allow more award operations
  } else if (endpoint.includes('/redeem')) {
    points = 3; // Stricter for redemptions
    duration = 300; // 5 minutes
  } else if (endpoint.includes('/admin')) {
    points = 30; // More generous for admin operations
  }
  
  const key = `ratelimit:points:${userId}:${endpoint}`;
  
  try {
    // Get current usage
    const current = await redis.get(key);
    const usage = current ? parseInt(current, 10) : 0;
    
    if (usage >= points) {
      // Rate limit exceeded
      return reply.code(429).send({
        data: null,
        errors: [{
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Try again in ${duration} seconds.`,
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Increment usage
    if (usage === 0) {
      await redis.set(key, 1, 'EX', duration);
    } else {
      await redis.incr(key);
    }
  } catch (error) {
    // Log but continue if Redis fails
    request.log.error('Rate limit check failed', { error });
  }
}

/**
 * Transaction verification middleware for idempotency and reliability
 */
export async function transactionVerificationMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Only apply to write operations
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return;
  }
  
  const redis = getRedisClient();
  
  // Generate transaction ID if not present
  if (!request.headers['x-transaction-id']) {
    const transactionId = crypto.randomUUID();
    request.headers['x-transaction-id'] = transactionId;
  }
  
  const transactionId = request.headers['x-transaction-id'] as string;
  
  try {
    // Check if transaction has been processed already (idempotency)
    const processed = await redis.get(`transaction:${transactionId}`);
    if (processed) {
      // Transaction already processed, return original response
      return reply.code(200).send(JSON.parse(processed));
    }
    
    // Store original send function to capture response
    const originalSend = reply.send;
    
    // Override send to record successful responses
    reply.send = function(payload: any) {
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
    // Log but continue if Redis fails
    request.log.error('Transaction verification failed', { error });
  }
}

/**
 * Input validation for points operations
 */
export async function pointsValidationMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Only apply to points-related endpoints with a request body
  if (!request.body || typeof request.body !== 'object') {
    return;
  }
  
  const body = request.body as PointsRequestBody;
  
  // Basic validation for required fields
  const errors = [];
  
  if (!body.userId) {
    errors.push('userId is required');
  }
  
  if (body.amount === undefined) {
    errors.push('amount is required');
  } else if (typeof body.amount !== 'number') {
    errors.push('amount must be a number');
  } else if (body.amount === 0) {
    errors.push('amount cannot be zero');
  }
  
  if (!body.source) {
    errors.push('source is required');
  } else {
    // Validate source is one of the allowed values
    const allowedSources = [
      'content_creation',
      'comment',
      'upvote_received',
      'daily_login',
      'achievement',
      'referral',
      'profile_completion',
      'wallet_connection',
      'streak_bonus',
      'transfer_in',
      'transfer_out',
      'redemption',
      'special_event',
      'admin_adjustment'
    ];
    
    if (!allowedSources.includes(body.source)) {
      errors.push(`source must be one of: ${allowedSources.join(', ')}`);
    }
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return reply.code(400).send({
      data: null,
      errors: [{
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Anti-exploitation protection middleware
 */
export async function pointsProtectionMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Only apply to award endpoint
  if (!request.routerPath.includes('/award')) {
    return;
  }
  
  const body = request.body as PointsRequestBody;
  
  // Get the anomaly detection service from container
  const { anomalyDetectionService } = request.diContainer.resolve('services');
  
  if (!anomalyDetectionService) {
    // Skip if service not available
    return;
  }
  
  try {
    // Check for anomalous activity
    const anomalyResult = await anomalyDetectionService.detectAnomaly({
      userId: body.userId,
      source: body.source,
      amount: body.amount,
      referenceId: body.referenceId,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string
    });
    
    // Block if high-risk activity detected
    if (anomalyResult.suggestedAction === 'block') {
      logger.warn('Blocked suspicious points activity', {
        userId: body.userId,
        source: body.source, 
        amount: body.amount,
        riskScore: anomalyResult.riskScore,
        reasons: anomalyResult.reasons
      });
      
      return reply.code(403).send({
        data: null,
        errors: [{
          code: 'SUSPICIOUS_ACTIVITY',
          message: 'This action has been blocked for security reasons',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Add anomaly result to request for logging/auditing
    request.anomalyResult = anomalyResult;
    
    // For review-level anomalies, attach a warning header but allow the request
    if (anomalyResult.suggestedAction === 'review') {
      reply.header('X-Activity-Risk', 'elevated');
    }
  } catch (error) {
    // Log but continue if anomaly detection fails
    request.log.error('Anomaly detection failed', { error });
  }
}

/**
 * Authorization middleware for points admin operations
 */
export async function pointsAdminAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Check if endpoint is an admin operation
  const isAdminEndpoint = request.routerPath.includes('/admin');
  
  if (!isAdminEndpoint) {
    return;
  }
  
  // Get RBAC service from container
  const { rbac } = request.diContainer.resolve('auth');
  
  // Check if user has admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Register all points middleware with the application
 */
export function registerPointsMiddleware(app: any) {
  // Apply middleware in order
  app.addHook('preHandler', pointsValidationMiddleware);
  app.addHook('preHandler', pointsRateLimitMiddleware);
  app.addHook('preHandler', transactionVerificationMiddleware);
  app.addHook('preHandler', pointsProtectionMiddleware);
  app.addHook('preHandler', pointsAdminAuthMiddleware);
}
