/**
 * Scheduler Routes
 * 
 * API routes for job scheduling
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SchedulerService } from '../scheduler/service';
import { isValidCronExpression } from '../scheduler/cron';

// Validation schemas
const createScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  queue: z.string().min(1),
  jobName: z.string().min(1),
  data: z.record(z.any()),
  pattern: z.string().refine(val => isValidCronExpression(val), {
    message: 'Invalid cron expression'
  }),
  timezone: z.string().optional(),
  enabled: z.boolean().optional()
});

const updateScheduleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pattern: z.string().refine(val => isValidCronExpression(val), {
    message: 'Invalid cron expression'
  }).optional(),
  timezone: z.string().optional(),
  data: z.record(z.any()).optional(),
  enabled: z.boolean().optional()
});

// Scheduler API Routes
const schedulerRoutes: FastifyPluginAsync = async (fastify) => {
  // Get scheduler service
  const schedulerService = fastify.diContainer.resolve<SchedulerService>('schedulerService');
  
  // Get all schedules
  fastify.get('/schedules', {
    schema: {
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
                  name: { type: 'string' },
                  queue: { type: 'string' },
                  jobName: { type: 'string' },
                  pattern: { type: 'string' },
                  timezone: { type: 'string' },
                  enabled: { type: 'boolean' },
                  lastRunAt: { type: ['string', 'null'] },
                  nextRunAt: { type: ['string', 'null'] },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
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
  }, async (request, reply) => {
    try {
      const schedules = await schedulerService.getSchedules();
      
      return reply.status(200).send({
        data: schedules,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get schedules', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get schedules',
          details: error.message
        }]
      });
    }
  });
  
  // Get a schedule by ID
  fastify.get('/schedules/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                name: { type: 'string' },
                queue: { type: 'string' },
                jobName: { type: 'string' },
                data: { type: 'object' },
                pattern: { type: 'string' },
                timezone: { type: 'string' },
                enabled: { type: 'boolean' },
                lastRunAt: { type: ['string', 'null'] },
                nextRunAt: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            data: { type: 'null' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const schedule = await schedulerService.getSchedule(id);
      
      if (!schedule) {
        return reply.status(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'RESOURCE_NOT_FOUND',
            message: `Schedule with ID ${id} not found`
          }]
        });
      }
      
      return reply.status(200).send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get schedule',
          details: error.message
        }]
      });
    }
  });
  
  // Create a new schedule
  fastify.post('/schedules', {
    schema: {
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['name', 'queue', 'jobName', 'data', 'pattern'],
            properties: {
              name: { type: 'string' },
              queue: { type: 'string' },
              jobName: { type: 'string' },
              data: { type: 'object' },
              pattern: { type: 'string' },
              timezone: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                queue: { type: 'string' },
                jobName: { type: 'string' },
                data: { type: 'object' },
                pattern: { type: 'string' },
                timezone: { type: 'string' },
                enabled: { type: 'boolean' },
                lastRunAt: { type: ['string', 'null'] },
                nextRunAt: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
    Body: { data: z.infer<typeof createScheduleSchema> }
  }>, reply: FastifyReply) => {
    try {
      // Validate input
      const { data } = request.body;
      createScheduleSchema.parse(data);
      
      // Create schedule
      const schedule = await schedulerService.createSchedule(data);
      
      return reply.status(201).send({
        data: schedule,
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
            message: 'Invalid schedule data',
            details: error.errors
          }]
        });
      }
      
      request.log.error('Failed to create schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to create schedule',
          details: error.message
        }]
      });
    }
  });
  
  // Update a schedule
  fastify.put('/schedules/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pattern: { type: 'string' },
              timezone: { type: 'string' },
              data: { type: 'object' },
              enabled: { type: 'boolean' }
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
                id: { type: 'string' },
                name: { type: 'string' },
                queue: { type: 'string' },
                jobName: { type: 'string' },
                data: { type: 'object' },
                pattern: { type: 'string' },
                timezone: { type: 'string' },
                enabled: { type: 'boolean' },
                lastRunAt: { type: ['string', 'null'] },
                nextRunAt: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
    Params: { id: string };
    Body: { data: z.infer<typeof updateScheduleSchema> }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { data } = request.body;
      
      // Validate input
      updateScheduleSchema.parse(data);
      
      // Update schedule
      const schedule = await schedulerService.updateSchedule(id, data);
      
      return reply.status(200).send({
        data: schedule,
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
            message: 'Invalid schedule data',
            details: error.errors
          }]
        });
      }
      
      // Handle not found error
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'RESOURCE_NOT_FOUND',
            message: error.message
          }]
        });
      }
      
      request.log.error('Failed to update schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to update schedule',
          details: error.message
        }]
      });
    }
  });
  
  // Delete a schedule
  fastify.delete('/schedules/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Delete schedule
      const success = await schedulerService.deleteSchedule(id);
      
      return reply.status(200).send({
        data: { success },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to delete schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to delete schedule',
          details: error.message
        }]
      });
    }
  });
  
  // Enable a schedule
  fastify.post('/schedules/:id/enable', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                name: { type: 'string' },
                queue: { type: 'string' },
                jobName: { type: 'string' },
                data: { type: 'object' },
                pattern: { type: 'string' },
                timezone: { type: 'string' },
                enabled: { type: 'boolean' },
                lastRunAt: { type: ['string', 'null'] },
                nextRunAt: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Enable schedule
      const schedule = await schedulerService.enableSchedule(id);
      
      return reply.status(200).send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      // Handle not found error
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'RESOURCE_NOT_FOUND',
            message: error.message
          }]
        });
      }
      
      request.log.error('Failed to enable schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to enable schedule',
          details: error.message
        }]
      });
    }
  });
  
  // Disable a schedule
  fastify.post('/schedules/:id/disable', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                name: { type: 'string' },
                queue: { type: 'string' },
                jobName: { type: 'string' },
                data: { type: 'object' },
                pattern: { type: 'string' },
                timezone: { type: 'string' },
                enabled: { type: 'boolean' },
                lastRunAt: { type: ['string', 'null'] },
                nextRunAt: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Disable schedule
      const schedule = await schedulerService.disableSchedule(id);
      
      return reply.status(200).send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      // Handle not found error
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'RESOURCE_NOT_FOUND',
            message: error.message
          }]
        });
      }
      
      request.log.error('Failed to disable schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to disable schedule',
          details: error.message
        }]
      });
    }
  });
  
  // Run a schedule immediately
  fastify.post('/schedules/:id/run', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Run schedule
      const job = await schedulerService.runScheduleNow(id);
      
      return reply.status(200).send({
        data: { jobId: job?.id || 'unknown' },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      // Handle not found error
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'RESOURCE_NOT_FOUND',
            message: error.message
          }]
        });
      }
      
      request.log.error('Failed to run schedule', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to run schedule',
          details: error.message
        }]
      });
    }
  });
};

export default schedulerRoutes;
