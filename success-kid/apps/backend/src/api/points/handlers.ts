/**
 * Points API Handlers
 * Handles requests for the points-related endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { PointsSource } from '../../models/user-points';
import { eventBus, EventType } from '../../lib/event-bus';

/**
 * Get user points balance
 * GET /api/v1/points/balance/:userId
 */
export async function getPointsBalance(
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
    // Get balance from service
    const balance = await pointsService.getUserBalance(userId);
    
    // Get recent transactions for context
    const transactions = await pointsService.getUserHistory(userId, { limit: 5 });
    
    // Return response
    return reply.send({
      data: {
        userId,
        balance,
        transactions,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error('Error getting points balance', { error, userId });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve points balance',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Award points to a user
 * POST /api/v1/points/award
 */
export async function awardPoints(
  request: FastifyRequest<{
    Body: {
      userId: string;
      amount: number;
      source: PointsSource;
      referenceId?: string;
      description?: string;
      skipVerification?: boolean;
      skipCaps?: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const { 
    userId, 
    amount, 
    source, 
    referenceId, 
    description, 
    skipVerification = false, 
    skipCaps = false 
  } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  const { rbac } = request.diContainer.resolve('auth');
  
  // Security check: Only admins can skip verification or caps
  if ((skipVerification || skipCaps) && !rbac.can(request.user.role, 'points:admin')) {
    return reply.code(403).send({
      data: null,
      errors: [{
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to skip verification or caps',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
  
  try {
    // Award points using service
    const result = await pointsService.awardPoints(
      userId,
      amount,
      source,
      {
        referenceId,
        description,
        skipVerification,
        skipCaps
      }
    );
    
    if (!result.success) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: result.reason === 'Daily cap exceeded' ? 'POINTS_CAP_EXCEEDED' : 'POINTS_AWARD_FAILED',
          message: result.reason || 'Failed to award points',
          details: result.remainingCap !== undefined ? { 
            remainingCap: result.remainingCap 
          } : undefined
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
    
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
    request.log.error('Error awarding points', { error, userId, amount, source });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to process points award',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get points history for a user
 * GET /api/v1/points/history/:userId
 */
export async function getPointsHistory(
  request: FastifyRequest<{
    Params: {
      userId: string;
    };
    Querystring: {
      limit?: number;
      offset?: number;
      source?: PointsSource;
    };
  }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const { limit = 20, offset = 0, source } = request.query;
  
  const { pointsService } = request.diContainer.resolve('services');
  
  try {
    // Get transactions from service
    const transactions = await pointsService.getUserHistory(userId, { limit, offset });
    
    // Filter by source if provided
    const filteredTransactions = source 
      ? transactions.filter(tx => tx.source === source)
      : transactions;
    
    // Get total count for pagination
    const total = await pointsService.getUserHistory(userId);
    const totalFiltered = source 
      ? total.filter(tx => tx.source === source).length
      : total.length;
    
    // Return response with pagination
    return reply.send({
      data: {
        userId,
        transactions: filteredTransactions,
        pagination: {
          total: totalFiltered,
          limit,
          offset,
          hasMore: offset + filteredTransactions.length < totalFiltered,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error('Error getting points history', { error, userId });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve points history',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

/**
 * Get daily caps status for a user
 * GET /api/v1/points/caps/:userId
 */
export async function getDailyCaps(
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
    // Get caps from service
    const caps = await pointsService.getDailyCapsStatus(userId);
    
    // Return response
    return reply.send({
      data: {
        userId,
        caps,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error('Error getting daily caps', { error, userId });
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve daily caps',
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  }
}

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
    return reply.send({
      data: eligibility,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error('Error getting redemption eligibility', { error, userId });
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
 * Redeem points for tokens
 * POST /api/v1/points/redeem
 */
export async function redeemPoints(
  request: FastifyRequest<{
    Body: {
      userId: string;
      amount: number;
      walletAddress?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { userId, amount, walletAddress } = request.body;
  
  const { pointsService } = request.diContainer.resolve('services');
  
  try {
    // Request redemption from service
    const result = await pointsService.requestRedemption(userId, amount, walletAddress);
    
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
        status: result.status,
        estimatedCompletionTime: result.estimatedProcessingTime,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  } catch (error) {
    request.log.error('Error redeeming points', { error, userId, amount });
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
