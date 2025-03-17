/**
 * Points Admin API Handlers
 * 
 * Admin-only endpoints for managing the points economy, including
 * manual adjustments, analytics, and system configuration.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { PointsSource } from '../../models/user-points';
import { logger } from '../../lib/logger';
import { pointsRules, specialEvents, isEventActive } from '../../config/points-rules-config';

/**
 * Admin award points to a user
 * POST /api/v1/points/admin/award
 */
export async function adminAwardPoints(
  request: FastifyRequest<{
    Body: {
      userId: string;
      amount: number;
      source: PointsSource;
      description: string;
      referenceId?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { userId, amount, source, description, referenceId } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Verify admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to award points as admin',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Award points with admin override (skip verification and caps)
    const result = await pointsService.awardPoints(
      userId,
      amount,
      source,
      {
        referenceId: referenceId || `admin:${request.user.id}:${Date.now()}`,
        description: description || `Admin adjustment by ${request.user.id}`,
        skipVerification: true,
        skipCaps: true
      }
    );
    
    if (!result.success) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'POINTS_AWARD_FAILED',
          message: result.reason || 'Failed to award points',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Log admin action for audit
    logger.info('Admin awarded points', {
      adminId: request.user.id,
      userId,
      amount,
      source,
      description
    });
    
    // Return successful response
    return reply.code(201).send({
      data: {
        transactionId: result.transactionId,
        userId,
        amount,
        source,
        balance: result.balance,
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error in admin award points', { error, userId, amount, source });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to process admin points award',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Admin deduct points from a user
 * POST /api/v1/points/admin/deduct
 */
export async function adminDeductPoints(
  request: FastifyRequest<{
    Body: {
      userId: string;
      amount: number;
      description: string;
      referenceId?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { userId, amount, description, referenceId } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Verify admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to deduct points as admin',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Convert to positive amount for validation
    const positiveAmount = Math.abs(amount);
    
    // Deduct points through service
    const result = await pointsService.deductPoints(
      userId,
      positiveAmount,
      'admin_adjustment',
      {
        referenceId: referenceId || `admin:${request.user.id}:${Date.now()}`,
        description: description || `Admin deduction by ${request.user.id}`
      }
    );
    
    if (!result.success) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'POINTS_DEDUCTION_FAILED',
          message: result.reason || 'Failed to deduct points',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Log admin action for audit
    logger.info('Admin deducted points', {
      adminId: request.user.id,
      userId,
      amount: positiveAmount,
      description
    });
    
    // Return successful response
    return reply.code(200).send({
      data: {
        transactionId: result.transactionId,
        userId,
        amount: -positiveAmount, // Display as negative
        source: 'admin_adjustment',
        balance: result.balance,
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error in admin deduct points', { error, userId, amount });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to process admin points deduction',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get points system statistics
 * GET /api/v1/points/admin/stats
 */
export async function getPointsStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { pointsAnalyticsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Verify admin permissions
  if (!rbac.can(request.user.role, 'points:read:stats')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to view points statistics',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Get system-wide metrics
    const stats = await pointsAnalyticsService.getSystemPointsMetrics();
    
    // Return response
    return reply.code(200).send({
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting points stats', { error });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve points statistics',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get points rules configuration
 * GET /api/v1/points/rules
 */
export async function getPointsRules(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Return rules configuration
    return reply.code(200).send({
      data: {
        activities: pointsRules,
        currentMultiplier: specialEvents ? 1.0 : 1.0, // Would come from getCurrentPointsMultiplier()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting points rules', { error });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve points rules',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get special events configuration
 * GET /api/v1/points/events
 */
export async function getSpecialEvents(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get all events with active status
    const events = Object.entries(specialEvents).map(([id, event]) => ({
      ...event,
      isActive: isEventActive(id)
    }));
    
    // Return events
    return reply.code(200).send({
      data: events,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting special events', { error });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve special events',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Toggle special event status
 * POST /api/v1/points/events/:id/toggle
 */
export async function toggleSpecialEvent(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      active: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const { active } = request.body;
  
  const { rbac } = request.diContainer.resolve('auth');
  
  // Verify admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to manage special events',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Check if event exists
    if (!specialEvents[id]) {
      return reply.code(404).send({
        data: null,
        errors: [{
          code: 'EVENT_NOT_FOUND',
          message: `Special event with ID ${id} not found`,
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // In a real implementation, this would update a database
    // For this example, we'll just simulate the update
    const updatedEvent = {
      ...specialEvents[id],
      isActive: active
    };
    
    // Log the action
    logger.info('Admin toggled special event', {
      adminId: request.user.id,
      eventId: id,
      active
    });
    
    // Return updated event
    return reply.code(200).send({
      data: updatedEvent,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error toggling special event', { error, id, active });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to toggle special event',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Reset user daily caps (dev/debug only)
 * POST /api/v1/points/debug/reset-caps/:userId
 */
export async function resetUserCaps(
  request: FastifyRequest<{
    Params: {
      userId: string;
    };
  }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  
  const { redis } = request.diContainer.resolve('db');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Verify admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to reset caps',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Get all cap-related keys for this user
    const keys = await redis.keys(`cap:${userId}:*`);
    
    // Delete all keys
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    // Log the action
    logger.info('Admin reset user caps', {
      adminId: request.user.id,
      userId,
      keysDeleted: keys.length
    });
    
    // Return success
    return reply.code(200).send({
      data: {
        userId,
        keysReset: keys.length,
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error resetting user caps', { error, userId });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to reset user caps',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Simulate activity for testing (dev/debug only)
 * POST /api/v1/points/debug/simulate-activity
 */
export async function simulateActivity(
  request: FastifyRequest<{
    Body: {
      userId: string;
      activity: PointsSource;
      count?: number;
    };
  }>,
  reply: FastifyReply
) {
  const { userId, activity, count = 1 } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Verify admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to simulate activity',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Check if activity exists in rules
    if (!pointsRules[activity]) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'INVALID_ACTIVITY',
          message: `Activity ${activity} is not valid`,
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Limit count to prevent abuse
    const safeCount = Math.min(count, 100);
    
    // Simulate activities
    const results = [];
    
    for (let i = 0; i < safeCount; i++) {
      const result = await pointsService.awardPoints(
        userId,
        pointsRules[activity].points,
        activity,
        {
          referenceId: `simulated:${Date.now()}-${i}`,
          description: `Simulated ${activity} activity`,
          skipVerification: true
        }
      );
      
      results.push(result);
    }
    
    // Log the action
    logger.info('Admin simulated activity', {
      adminId: request.user.id,
      userId,
      activity,
      count: safeCount,
      successCount: results.filter(r => r.success).length
    });
    
    // Return results
    return reply.code(200).send({
      data: {
        userId,
        activity,
        requestedCount: count,
        simulatedCount: safeCount,
        successCount: results.filter(r => r.success).length,
        failures: results.filter(r => !r.success).map(r => r.reason),
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error simulating activity', { error, userId, activity, count });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to simulate activity',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}
