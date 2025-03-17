/**
 * Points Admin API Handlers
 * Handles requests for the admin-only points endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { RedemptionStatus } from '../../services/points/redemption-service';

/**
 * Get all flagged redemptions
 * GET /api/v1/admin/points/redemptions/flagged
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
  
  try {
    // Convert dates if provided
    const queryOptions = {
      limit,
      offset,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    
    // Get flagged redemptions from service
    const { data, pagination } = await pointsService.getFlaggedRedemptions(queryOptions);
    
    // Return response
    return reply.send({
      data,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error('Error getting flagged redemptions', { 
      error, 
      query: request.query 
    });
    
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
 * Review a flagged redemption
 * POST /api/v1/admin/points/redemptions/:id/review
 */
export async function reviewRedemption(
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
  const reviewerId = request.user.id;
  
  try {
    // Validate action
    if (action !== 'approve' && action !== 'reject') {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Action must be "approve" or "reject"',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Validate reason
    if (!reason || reason.trim().length < 5) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Reason must be provided (minimum 5 characters)',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Process review
    const redemption = await pointsService.reviewFlaggedRedemption(
      id,
      action,
      reason,
      reviewerId
    );
    
    // Return response
    return reply.send({
      data: {
        redemptionId: id,
        action,
        status: redemption.status,
        updatedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    request.log.error('Error reviewing redemption', { 
      error, 
      redemptionId: id, 
      action, 
      reviewerId 
    });
    
    // Check for known error types
    if (error.message && error.message.includes('not found')) {
      return reply.code(404).send({
        data: null,
        errors: [{
          code: 'NOT_FOUND',
          message: 'Redemption not found',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    if (error.message && error.message.includes('not in flagged status')) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'INVALID_STATUS',
          message: 'Redemption is not in flagged status',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
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

/**
 * Get redemption analytics
 * GET /api/v1/admin/points/redemptions/stats
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
  
  try {
    // Convert dates if provided
    const queryOptions = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    
    // Get redemption stats from service
    const stats = await pointsService.getRedemptionStats(queryOptions);
    
    // Return response
    return reply.send({
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        timeframe: {
          startDate: startDate || 'all time',
          endDate: endDate || 'present'
        }
      },
    });
  } catch (error) {
    request.log.error('Error getting redemption stats', { 
      error, 
      query: request.query 
    });
    
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
 * Get redemption by id (admin detailed view)
 * GET /api/v1/admin/points/redemptions/:id
 */
export async function getRedemptionById(
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
    // Get redemption from service
    const redemption = await pointsService.getRedemptionStatus(id);
    
    if (!redemption) {
      return reply.code(404).send({
        data: null,
        errors: [{
          code: 'NOT_FOUND',
          message: 'Redemption not found',
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
    // Get transaction info if available
    let transactionDetails = null;
    if (redemption.transactionHash) {
      const { blockchainService } = request.diContainer.resolve('services');
      transactionDetails = await blockchainService.getTransactionStatus(redemption.transactionHash);
    }
    
    // Return response
    return reply.send({
      data: {
        redemption,
        transaction: transactionDetails
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    request.log.error('Error getting redemption details', { 
      error, 
      redemptionId: id 
    });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve redemption details',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}
