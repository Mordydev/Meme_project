/**
 * Points route schemas for API documentation
 */
import { FastifyInstance } from 'fastify';

/**
 * Register points route schemas
 */
export function pointsRoutes(fastify: FastifyInstance): void {
  // Points balance response for GET /points/balance
  fastify.addSchema({
    $id: 'pointsBalanceResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          balance: {
            type: 'integer',
            description: 'Current points balance',
          },
          daily_earned: {
            type: 'integer',
            description: 'Points earned today',
          },
          lifetime_earned: {
            type: 'integer',
            description: 'Total points earned',
          },
          lifetime_spent: {
            type: 'integer',
            description: 'Total points spent',
          },
        },
        required: ['balance'],
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
  
  // Points transaction history response for GET /points/history
  fastify.addSchema({
    $id: 'pointsHistoryResponse',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Transaction ID',
            },
            amount: {
              type: 'integer',
              description: 'Transaction amount',
            },
            source: {
              type: 'string',
              description: 'Source of the transaction',
            },
            reference_id: {
              type: 'string',
              description: 'Reference ID (if applicable)',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction timestamp',
            },
            description: {
              type: 'string',
              description: 'Transaction description',
            },
          },
          required: ['id', 'amount', 'source', 'created_at'],
        },
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
      pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number',
          },
          pageSize: {
            type: 'integer',
            description: 'Number of items per page',
          },
          totalItems: {
            type: 'integer',
            description: 'Total number of items',
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
          },
        },
        required: ['page', 'pageSize', 'totalItems', 'totalPages'],
      },
    },
    required: ['data', 'meta', 'pagination'],
  });
  
  // Award points request for POST /points/award
  fastify.addSchema({
    $id: 'awardPointsRequest',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'User ID to award points to',
          },
          amount: {
            type: 'integer',
            minimum: 1,
            description: 'Amount of points to award',
          },
          source: {
            type: 'string',
            description: 'Source of the points',
          },
          reference_id: {
            type: 'string',
            description: 'Reference ID (if applicable)',
          },
          description: {
            type: 'string',
            description: 'Transaction description',
          },
        },
        required: ['user_id', 'amount', 'source'],
      },
    },
    required: ['data'],
  });
  
  // Award points response for POST /points/award
  fastify.addSchema({
    $id: 'awardPointsResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the points were awarded successfully',
          },
          transaction_id: {
            type: 'string',
            description: 'Transaction ID',
          },
          amount: {
            type: 'integer',
            description: 'Amount of points awarded',
          },
          new_balance: {
            type: 'integer',
            description: 'New points balance',
          },
          daily_earned: {
            type: 'integer',
            description: 'Points earned today',
          },
        },
        required: ['success', 'transaction_id', 'amount', 'new_balance'],
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
  
  // Redeem points request for POST /points/redeem
  fastify.addSchema({
    $id: 'redeemPointsRequest',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          amount: {
            type: 'integer',
            minimum: 1000,
            description: 'Amount of points to redeem',
          },
        },
        required: ['amount'],
      },
    },
    required: ['data'],
  });
  
  // Redeem points response for POST /points/redeem
  fastify.addSchema({
    $id: 'redeemPointsResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the points were redeemed successfully',
          },
          transaction_id: {
            type: 'string',
            description: 'Transaction ID',
          },
          amount: {
            type: 'integer',
            description: 'Amount of points redeemed',
          },
          token_amount: {
            type: 'number',
            description: 'Amount of tokens received',
          },
          new_balance: {
            type: 'integer',
            description: 'New points balance',
          },
          status: {
            type: 'string',
            enum: ['processing', 'completed', 'failed'],
            description: 'Redemption status',
          },
        },
        required: ['success', 'transaction_id', 'amount', 'new_balance', 'status'],
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
}
