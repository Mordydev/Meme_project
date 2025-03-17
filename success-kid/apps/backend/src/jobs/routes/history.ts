/**
 * Job History Routes
 * 
 * API routes for job history and analytics
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { jobHistoryService } from '../history/service';

// Validation schemas
const jobHistoryQuerySchema = z.object({
  queue: z.string().optional(),
  jobName: z.string().optional(),
  status: z.enum(['completed', 'failed', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
});

const analyticsOptionsSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  queues: z.array(z.string()).optional(),
  granularity: z.enum(['hour', 'day', 'week'])
});

// Job history routes
const historyRoutes: FastifyPluginAsync = async (fastify) => {
  // Get job history
  fastify.get('/jobs/history', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          queue: { type: 'string' },
          jobName: { type: 'string' },
          status: { type: 'string', enum: ['completed', 'failed', 'cancelled'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          page: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          sortBy: { type: 'string' },
          sortDirection: { type: 'string', enum: ['asc', 'desc'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                entries: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      queue: { type: 'string' },
                      jobId: { type: 'string' },
                      name: { type: 'string' },
                      startedAt: { type: 'string' },
                      finishedAt: { type: ['string', 'null'] },
                      processingTime: { type: ['number', 'null'] },
                      attempts: { type: 'number' },
                      status: { type: 'string' }
                    }
                  }
                },
                page: { type: 'number' },
                pageSize: { type: 'number' },
                totalItems: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: z.infer<typeof jobHistoryQuerySchema>
  }>, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const query = jobHistoryQuerySchema.parse(request.query);
      
      // Convert date strings to Date objects
      if (query.startDate) {
        query.startDate = new Date(query.startDate);
      }
      
      if (query.endDate) {
        query.endDate = new Date(query.endDate);
      }
      
      // Get job history
      const history = await jobHistoryService.getJobHistory(query);
      
      // Return response
      return reply.status(200).send({
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors
          }]
        });
      }
      
      request.log.error('Failed to get job history', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get job history',
          details: error.message
        }]
      });
    }
  });
  
  // Get recent job history
  fastify.get('/jobs/history/recent', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          queue: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  queue: { type: 'string' },
                  jobId: { type: 'string' },
                  name: { type: 'string' },
                  startedAt: { type: 'string' },
                  finishedAt: { type: ['string', 'null'] },
                  processingTime: { type: ['number', 'null'] },
                  attempts: { type: 'number' },
                  status: { type: 'string' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: { queue?: string; limit?: number }
  }>, reply: FastifyReply) => {
    try {
      const { queue, limit = 20 } = request.query;
      
      // Get recent job history
      const history = await jobHistoryService.getRecentJobHistory(queue, limit);
      
      // Return response
      return reply.status(200).send({
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get recent job history', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get recent job history',
          details: error.message
        }]
      });
    }
  });
  
  // Generate job analytics
  fastify.post('/jobs/analytics', {
    schema: {
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['startTime', 'endTime', 'granularity'],
            properties: {
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              queues: { 
                type: 'array',
                items: { type: 'string' } 
              },
              granularity: { 
                type: 'string',
                enum: ['hour', 'day', 'week']
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                timeRange: {
                  type: 'object',
                  properties: {
                    startTime: { type: 'string' },
                    endTime: { type: 'string' }
                  }
                },
                metrics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string' },
                      completed: { type: 'number' },
                      failed: { type: 'number' },
                      averageProcessingTime: { type: 'number' },
                      throughput: { type: 'number' }
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalJobs: { type: 'number' },
                    successRate: { type: 'number' },
                    averageProcessingTime: { type: 'number' },
                    peakThroughput: { type: 'number' }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: { data: z.infer<typeof analyticsOptionsSchema> }
  }>, reply: FastifyReply) => {
    try {
      // Validate options
      const options = analyticsOptionsSchema.parse(request.body.data);
      
      // Convert date strings to Date objects
      const analyticsOptions = {
        ...options,
        startTime: new Date(options.startTime),
        endTime: new Date(options.endTime)
      };
      
      // Generate analytics
      const analytics = await jobHistoryService.generateJobAnalytics(analyticsOptions);
      
      // Return response
      return reply.status(200).send({
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'VALIDATION_ERROR',
            message: 'Invalid analytics options',
            details: error.errors
          }]
        });
      }
      
      request.log.error('Failed to generate job analytics', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to generate job analytics',
          details: error.message
        }]
      });
    }
  });
  
  // Clean up old job history
  fastify.post('/jobs/history/cleanup', {
    schema: {
      body: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              maxAgeDays: { type: 'number', minimum: 1 }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                deleted: { type: 'number' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: { data?: { maxAgeDays?: number } }
  }>, reply: FastifyReply) => {
    try {
      // Get max age in days (default to 30)
      const maxAgeDays = request.body?.data?.maxAgeDays || 30;
      
      // Convert to milliseconds
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
      
      // Purge old records
      const deleted = await jobHistoryService.purgeOldRecords(maxAge);
      
      // Return response
      return reply.status(200).send({
        data: { deleted },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to clean up old job history', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to clean up old job history',
          details: error.message
        }]
      });
    }
  });
};

export default historyRoutes;
