/**
 * Redemption Routes
 * 
 * Registers all redemption-related API routes.
 */
import { FastifyInstance } from 'fastify';
import { RedemptionController } from '../controllers/redemption-controller';

/**
 * Register redemption routes
 * 
 * @param fastify Fastify instance
 * @param controller Redemption controller
 */
export async function registerRedemptionRoutes(
  fastify: FastifyInstance,
  controller: RedemptionController
) {
  // Create redemption request
  fastify.post('/redeem', {
    schema: {
      description: 'Redeem points for tokens',
      tags: ['redemption'],
      body: {
        type: 'object',
        required: ['pointsAmount', 'walletAddress'],
        properties: {
          pointsAmount: { type: 'number', minimum: 1000, multipleOf: 100 },
          walletAddress: { type: 'string', minLength: 20 },
          referenceId: { type: 'string' }
        }
      },
      response: {
        201: {
          description: 'Redemption created successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                pointsAmount: { type: 'number' },
                tokenAmount: { type: 'number' },
                walletAddress: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'processing', 'pending_confirmation', 'completed', 'failed', 'cancelled'] },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.createRedemption.bind(controller));

  // Get redemption eligibility
  fastify.get('/eligibility', {
    schema: {
      description: 'Check redemption eligibility',
      tags: ['redemption'],
      response: {
        200: {
          description: 'Redemption eligibility status',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                eligible: { type: 'boolean' },
                reasons: { 
                  type: 'array', 
                  items: { type: 'string' },
                  nullable: true 
                },
                limits: { 
                  type: 'object',
                  properties: {
                    weekly: { 
                      type: 'object',
                      properties: {
                        limit: { type: 'number' },
                        used: { type: 'number' },
                        remaining: { type: 'number' }
                      }
                    },
                    minimum: { type: 'number' }
                  }
                },
                walletVerified: { type: 'boolean' },
                accountStatus: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.getEligibility.bind(controller));

  // Get conversion rate
  fastify.get('/conversion-rate', {
    schema: {
      description: 'Get points to token conversion rate',
      tags: ['redemption'],
      response: {
        200: {
          description: 'Conversion rate',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                conversionRate: { type: 'number' },
                pointsToToken: { type: 'string' },
                limits: {
                  type: 'object',
                  properties: {
                    minimum: { type: 'number' },
                    weekly: { type: 'number' }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.getConversionRate.bind(controller));

  // Get user redemptions
  fastify.get('/history', {
    schema: {
      description: 'Get user redemption history',
      tags: ['redemption'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      },
      response: {
        200: {
          description: 'User redemption history',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  pointsAmount: { type: 'number' },
                  tokenAmount: { type: 'number' },
                  walletAddress: { type: 'string' },
                  status: { type: 'string', enum: ['pending', 'processing', 'pending_confirmation', 'completed', 'failed', 'cancelled'] },
                  transactionHash: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  processedAt: { type: 'string', format: 'date-time', nullable: true },
                  completedAt: { type: 'string', format: 'date-time', nullable: true },
                  error: { type: 'string', nullable: true }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.getUserRedemptions.bind(controller));

  // Get specific redemption
  fastify.get('/:id', {
    schema: {
      description: 'Get a specific redemption by ID',
      tags: ['redemption'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Redemption details',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                pointsAmount: { type: 'number' },
                tokenAmount: { type: 'number' },
                walletAddress: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'processing', 'pending_confirmation', 'completed', 'failed', 'cancelled'] },
                transactionHash: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                processedAt: { type: 'string', format: 'date-time', nullable: true },
                completedAt: { type: 'string', format: 'date-time', nullable: true },
                error: { type: 'string', nullable: true }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.getRedemption.bind(controller));

  // Cancel redemption
  fastify.post('/:id/cancel', {
    schema: {
      description: 'Cancel a pending redemption',
      tags: ['redemption'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Redemption cancelled successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                status: { type: 'string', enum: ['cancelled'] },
                message: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.cancelRedemption.bind(controller));
}
