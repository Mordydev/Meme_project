/**
 * Points Redemption API Handlers
 * 
 * Handles requests for the points redemption-related endpoints,
 * providing a comprehensive interface for token redemption.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

/**
 * Get redemption eligibility for a user
 * GET /api/v1/points/redemption/eligibility/:userId
 */
export async function getRedemptionEligibility(
  request: FastifyRequest<{
    Params: {
      userId: string;
    };
  }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  
  const { pointsService } = request.diContainer.resolve('services');
  
  try {
    // Get eligibility from service
    const eligibility = await pointsService.getRedemptionEligibility(userId);
    
    // Return response
    return reply.code(200).send({
      data: eligibility,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting redemption eligibility', { error, userId });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve redemption eligibility',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Request points redemption
 * POST /api/v1/points/redemption
 */
export async function requestRedemption(
  request: FastifyRequest<{
    Body: {
      userId: string;
      amount: number;
      walletAddress?: string;
      metadata?: Record<string, any>;
    };
  }>,
  reply: FastifyReply
) {
  const { userId, amount, walletAddress, metadata = {} } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  
  try {
    // Add request metadata
    const enhancedMetadata = {
      ...metadata,
      requestIp: request.ip,
      userAgent: request.headers['user-agent'],
      requestTime: new Date().toISOString(),
    };
    
    // Request redemption from service
    const result = await pointsService.requestRedemption(
      userId, 
      amount, 
      walletAddress,
      enhancedMetadata,
      request.ip,
      request.headers['user-agent'] as string
    );
    
    if (!result.success) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'REDEMPTION_FAILED',
          message: result.reason || 'Failed to process redemption',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Return successful response
    return reply.code(202).send({
      data: {
        redemptionId: result.redemptionId,
        userId,
        pointsAmount: result.pointsAmount,
        tokenAmount: result.tokenAmount,
        walletAddress: result.walletAddress,
        status: result.status,
        estimatedCompletionTime: result.estimatedProcessingTime,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error processing redemption request', { error, userId, amount });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to process redemption request',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get redemption status
 * GET /api/v1/points/redemption/:id
 */
export async function getRedemptionStatus(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  
  const { pointsService } = request.diContainer.resolve('services');
  
  try {
    // Get status from service
    const redemption = await pointsService.getRedemptionStatus(id);
    
    if (!redemption) {
      return reply.code(404).send({
        data: null,
        errors: [{
          code: 'REDEMPTION_NOT_FOUND',
          message: 'Redemption not found',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Return response
    return reply.code(200).send({
      data: redemption,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting redemption status', { error, id });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve redemption status',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get redemption history for a user
 * GET /api/v1/points/redemption/history/:userId
 */
export async function getRedemptionHistory(
  request: FastifyRequest<{
    Params: {
      userId: string;
    };
    Querystring: {
      limit?: number;
      offset?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const { 
    limit = 20, 
    offset = 0, 
    status,
    startDate,
    endDate
  } = request.query;
  
  const { pointsService } = request.diContainer.resolve('services');
  
  try {
    // Parse status array if provided
    const statusArray = status ? status.split(',') : undefined;
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    
    // Get history from service
    const history = await pointsService.getRedemptionHistory(userId, {
      limit: Number(limit),
      offset: Number(offset),
      status: statusArray,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });
    
    // Return response
    return reply.code(200).send({
      data: history.data,
      pagination: history.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting redemption history', { error, userId });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve redemption history',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get redemption statistics
 * GET /api/v1/points/redemption/stats
 */
export async function getRedemptionStats(
  request: FastifyRequest<{
    Querystring: {
      startDate?: string;
      endDate?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { startDate, endDate } = request.query;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Check if user has admin permissions
  if (!rbac.can(request.user.role, 'points:read:stats')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to access redemption statistics',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    
    // Get stats from service
    const stats = await pointsService.getRedemptionStats({
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });
    
    // Return response
    return reply.code(200).send({
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting redemption stats', { error });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve redemption statistics',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get flagged redemptions for review
 * GET /api/v1/points/redemption/flagged
 */
export async function getFlaggedRedemptions(
  request: FastifyRequest<{
    Querystring: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { limit = 20, offset = 0, startDate, endDate } = request.query;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Check if user has admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to access flagged redemptions',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    
    // Get flagged redemptions from service
    const flagged = await pointsService.getFlaggedRedemptions({
      limit: Number(limit),
      offset: Number(offset),
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });
    
    // Return response
    return reply.code(200).send({
      data: flagged.data,
      pagination: flagged.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error getting flagged redemptions', { error });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve flagged redemptions',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Review flagged redemption
 * POST /api/v1/points/redemption/flagged/:id/review
 */
export async function reviewFlaggedRedemption(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      action: 'approve' | 'reject';
      reason: string;
    };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const { action, reason } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Check if user has admin permissions
  if (!rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to review redemptions',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Review redemption
    const updated = await pointsService.reviewFlaggedRedemption(
      id,
      action,
      reason,
      request.user.id
    );
    
    // Return response
    return reply.code(200).send({
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    logger.error('Error reviewing flagged redemption', { error, id, action });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to process redemption review',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}
