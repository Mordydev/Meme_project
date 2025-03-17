/**
 * Job Routes
 * 
 * API routes for job management
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { jobService } from '../service';
import { QueueName } from '../queues';

// Validation schemas
const addJobSchema = z.object({
  queue: z.enum([
    QueueName.POINTS, 
    QueueName.CONTENT, 
    QueueName.MEDIA, 
    QueueName.NOTIFICATIONS
  ]),
  name: z.string(),
  data: z.record(z.any()),
  options: z.object({
    priority: z.number().optional(),
    delay: z.number().optional(),
    attempts: z.number().optional(),
    timeout: z.number().optional(),
    removeOnComplete: z.union([z.boolean(), z.number()]).optional(),
    removeOnFail: z.union([z.boolean(), z.number()]).optional(),
  }).optional(),
});

const getJobSchema = z.object({
  queue: z.enum([
    QueueName.POINTS, 
    QueueName.CONTENT, 
    QueueName.MEDIA, 
    QueueName.NOTIFICATIONS
  ]),
  jobId: z.string(),
});

const retryJobSchema = z.object({
  queue: z.enum([
    QueueName.POINTS, 
    QueueName.CONTENT, 
    QueueName.MEDIA, 
    QueueName.NOTIFICATIONS
  ]),
  jobId: z.string(),
});

const removeJobSchema = z.object({
  queue: z.enum([
    QueueName.POINTS, 
    QueueName.CONTENT, 
    QueueName.MEDIA, 
    QueueName.NOTIFICATIONS
  ]),
  jobId: z.string(),
});

const getQueueStatsSchema = z.object({
  queue: z.enum([
    QueueName.POINTS, 
    QueueName.CONTENT, 
    QueueName.MEDIA, 
    QueueName.NOTIFICATIONS
  ]),
});

// Jobs API Routes
const jobsRoutes: FastifyPluginAsync = async (fastify) => {
  // Add a job
  fastify.post('/jobs', {
    schema: {
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['queue', 'name', 'data'],
            properties: {
              queue: { type: 'string' },
              name: { type: 'string' },
              data: { type: 'object' },
              options: {
                type: 'object',
                properties: {
                  priority: { type: 'number' },
                  delay: { type: 'number' },
                  attempts: { type: 'number' },
                  timeout: { type: 'number' },
                  removeOnComplete: { type: ['boolean', 'number'] },
                  removeOnFail: { type: ['boolean', 'number'] },
                }
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
                jobId: { type: 'string' }
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
    Body: { data: z.infer<typeof addJobSchema> }
  }>, reply: FastifyReply) => {
    try {
      const { queue, name, data, options } = request.body.data;
      
      // Validate input
      addJobSchema.parse({ queue, name, data, options });
      
      // Add job
      const jobId = await jobService.addJob(
        queue as QueueName,
        name as any,
        data,
        options
      );
      
      // Return success response
      return reply.status(200).send({
        data: { jobId },
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
            message: 'Invalid job data',
            details: error.errors
          }]
        });
      }
      
      // Log and return error
      request.log.error('Failed to add job', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to add job',
          details: error.message
        }]
      });
    }
  });
  
  // Get job status
  fastify.get('/jobs/:queue/:jobId', {
    schema: {
      params: {
        type: 'object',
        required: ['queue', 'jobId'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                state: { type: 'string' },
                progress: { type: 'number' },
                attempts: { type: 'number' },
                reason: { type: 'string' },
                result: { type: 'object' }
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
    Params: z.infer<typeof getJobSchema>
  }>, reply: FastifyReply) => {
    try {
      const { queue, jobId } = request.params;
      
      // Validate input
      getJobSchema.parse({ queue, jobId });
      
      // Get job status
      const jobStatus = await jobService.getJobStatus(
        queue as QueueName,
        jobId
      );
      
      // Return response
      return reply.status(200).send({
        data: jobStatus || { id: jobId, state: 'not_found' },
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
            message: 'Invalid parameters',
            details: error.errors
          }]
        });
      }
      
      // Log and return error
      request.log.error('Failed to get job status', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get job status',
          details: error.message
        }]
      });
    }
  });
  
  // Retry a job
  fastify.post('/jobs/:queue/:jobId/retry', {
    schema: {
      params: {
        type: 'object',
        required: ['queue', 'jobId'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
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
    Params: z.infer<typeof retryJobSchema>
  }>, reply: FastifyReply) => {
    try {
      const { queue, jobId } = request.params;
      
      // Validate input
      retryJobSchema.parse({ queue, jobId });
      
      // Retry job
      const success = await jobService.retryJob(
        queue as QueueName,
        jobId
      );
      
      // Return response
      return reply.status(200).send({
        data: { success },
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
            message: 'Invalid parameters',
            details: error.errors
          }]
        });
      }
      
      // Log and return error
      request.log.error('Failed to retry job', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to retry job',
          details: error.message
        }]
      });
    }
  });
  
  // Remove a job
  fastify.delete('/jobs/:queue/:jobId', {
    schema: {
      params: {
        type: 'object',
        required: ['queue', 'jobId'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
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
    Params: z.infer<typeof removeJobSchema>
  }>, reply: FastifyReply) => {
    try {
      const { queue, jobId } = request.params;
      
      // Validate input
      removeJobSchema.parse({ queue, jobId });
      
      // Remove job
      const success = await jobService.removeJob(
        queue as QueueName,
        jobId
      );
      
      // Return response
      return reply.status(200).send({
        data: { success },
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
            message: 'Invalid parameters',
            details: error.errors
          }]
        });
      }
      
      // Log and return error
      request.log.error('Failed to remove job', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to remove job',
          details: error.message
        }]
      });
    }
  });
  
  // Get queue stats
  fastify.get('/jobs/queues/:queue/stats', {
    schema: {
      params: {
        type: 'object',
        required: ['queue'],
        properties: {
          queue: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                counts: {
                  type: 'object',
                  properties: {
                    waiting: { type: 'number' },
                    active: { type: 'number' },
                    completed: { type: 'number' },
                    failed: { type: 'number' },
                    delayed: { type: 'number' },
                    paused: { type: 'number' }
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
    Params: z.infer<typeof getQueueStatsSchema>
  }>, reply: FastifyReply) => {
    try {
      const { queue } = request.params;
      
      // Validate input
      getQueueStatsSchema.parse({ queue });
      
      // Get queue stats
      const stats = await jobService.getQueueStats(queue as QueueName);
      
      // Return response
      return reply.status(200).send({
        data: stats,
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
            message: 'Invalid parameters',
            details: error.errors
          }]
        });
      }
      
      // Log and return error
      request.log.error('Failed to get queue stats', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get queue stats',
          details: error.message
        }]
      });
    }
  });
};

export default jobsRoutes;
