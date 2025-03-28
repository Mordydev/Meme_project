/**
 * Points Schema Definitions
 * 
 * Defines points-related schemas for OpenAPI documentation.
 */

const pointsSchemas = {
  PointsTransaction: {
    type: 'object',
    required: ['id', 'userId', 'amount', 'source', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique transaction identifier'
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID associated with this transaction'
      },
      amount: {
        type: 'integer',
        description: 'Point amount (positive for earning, negative for spending)'
      },
      source: {
        type: 'string',
        description: 'Source of points transaction',
        enum: [
          'content_creation',
          'comment',
          'upvote_received',
          'daily_login',
          'achievement',
          'referral',
          'streak_bonus',
          'profile_completion',
          'wallet_connection',
          'redemption',
          'admin_adjustment',
          'other'
        ]
      },
      referenceId: {
        type: 'string',
        description: 'Reference ID related to this transaction (e.g., content ID, achievement ID)'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Transaction timestamp'
      },
      description: {
        type: 'string',
        description: 'Human-readable description of the transaction'
      }
    }
  },

  PointsBalance: {
    type: 'object',
    required: ['balance'],
    properties: {
      balance: {
        type: 'integer',
        description: 'Current points balance'
      },
      lastUpdated: {
        type: 'string',
        format: 'date-time',
        description: 'Last balance update timestamp'
      },
      dailyEarnings: {
        type: 'object',
        additionalProperties: {
          type: 'integer'
        },
        description: 'Points earned today by source'
      }
    }
  },

  PointsAwardRequest: {
    type: 'object',
    required: ['userId', 'amount', 'source'],
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID to award points to'
      },
      amount: {
        type: 'integer',
        minimum: 1,
        description: 'Amount of points to award'
      },
      source: {
        type: 'string',
        description: 'Source of points',
        enum: [
          'content_creation',
          'comment',
          'upvote_received',
          'daily_login',
          'achievement',
          'referral',
          'streak_bonus',
          'profile_completion',
          'wallet_connection',
          'admin_adjustment',
          'other'
        ]
      },
      referenceId: {
        type: 'string',
        description: 'Optional reference ID for the transaction'
      },
      description: {
        type: 'string',
        description: 'Optional description of the transaction'
      }
    }
  },

  PointsRedemptionRequest: {
    type: 'object',
    required: ['amount'],
    properties: {
      amount: {
        type: 'integer',
        minimum: 1000,
        description: 'Amount of points to redeem (minimum 1000)'
      },
      walletAddress: {
        type: 'string',
        description: 'Optional wallet address (uses connected wallet if not provided)'
      }
    }
  },

  PointsHistoryResponse: {
    type: 'object',
    required: ['data', 'meta', 'pagination'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PointsTransaction'
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          requestId: {
            type: 'string'
          }
        }
      },
      pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer'
          },
          pageSize: {
            type: 'integer'
          },
          totalItems: {
            type: 'integer'
          },
          totalPages: {
            type: 'integer'
          }
        }
      }
    }
  },

  PointsAwardResponse: {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          amount: {
            type: 'integer'
          },
          newTotal: {
            type: 'integer'
          },
          transaction: {
            $ref: '#/components/schemas/PointsTransaction'
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          requestId: {
            type: 'string'
          }
        }
      }
    }
  }
};

export default pointsSchemas;
