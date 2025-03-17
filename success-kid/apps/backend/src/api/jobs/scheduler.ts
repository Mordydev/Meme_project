/**
 * Scheduler Routes
 * 
 * API endpoints for managing scheduled jobs.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  getSchedules, 
  getScheduleById, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule, 
  enableSchedule, 
  disableSchedule, 
  runScheduleNow,
  CronExpression
} from '../../jobs/scheduler';
import { isValidCronExpression, describeCronExpression, getNextExecutionTimes } from '../../jobs/scheduler/cron';

/**
 * Register scheduler routes
 * 
 * @param fastify Fastify instance
 */
export default async function schedulerRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get all schedules
   */
  fastify.get('/', async (request, reply) => {
    const schedules = getSchedules();
    
    return reply.send({
      data: schedules,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
  
  /**
   * Get common cron expressions
   */
  fastify.get('/cron-expressions', async (request, reply) => {
    const expressions = Object.entries(CronExpression).map(([name, expression]) => ({
      name,
      expression,
      description: describeCronExpression(expression),
      nextExecutions: getNextExecutionTimes(expression, 3)
    }));
    
    return reply.send({
      data: expressions,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
  
  /**
   * Validate a cron expression
   */
  fastify.get('/validate-cron', async (request: FastifyRequest<{
    Querystring: { expression: string, count?: string }
  }>, reply) => {
    const { expression } = request.query;
    const count = parseInt(request.query.count || '5', 10);
    
    const isValid = isValidCronExpression(expression);
    
    return reply.send({
      data: {
        expression,
        isValid,
        description: isValid ? describeCronExpression(expression) : 'Invalid expression',
        nextExecutions: isValid ? getNextExecutionTimes(expression, count) : []
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
  
  /**
   * Get a specific schedule
   */
  fastify.get('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    const schedule = getScheduleById(id);
    
    if (!schedule) {
      return reply.code(404).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_NOT_FOUND',
            message: `Schedule "${id}" not found`
          }
        ]
      });
    }
    
    return reply.send({
      data: schedule,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
  
  /**
   * Create a new schedule
   */
  fastify.post('/', async (request: FastifyRequest<{
    Body: {
      name: string,
      queue: string,
      jobName: string,
      data: any,
      pattern: string,
      timezone?: string,
      enabled?: boolean
    }
  }>, reply) => {
    const { name, queue, jobName, data, pattern, timezone, enabled = true } = request.body;
    
    // Validate cron pattern
    if (!isValidCronExpression(pattern)) {
      return reply.code(400).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'INVALID_CRON_PATTERN',
            message: `Invalid cron pattern: ${pattern}`
          }
        ]
      });
    }
    
    try {
      const schedule = await createSchedule({
        name,
        queue,
        jobName,
        data,
        pattern,
        timezone,
        enabled
      });
      
      return reply.code(201).send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return reply.code(400).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_CREATION_FAILED',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Update a schedule
   */
  fastify.put('/:id', async (request: FastifyRequest<{
    Params: { id: string },
    Body: {
      name?: string,
      queue?: string,
      jobName?: string,
      data?: any,
      pattern?: string,
      timezone?: string,
      enabled?: boolean
    }
  }>, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    // Validate cron pattern if provided
    if (updates.pattern && !isValidCronExpression(updates.pattern)) {
      return reply.code(400).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'INVALID_CRON_PATTERN',
            message: `Invalid cron pattern: ${updates.pattern}`
          }
        ]
      });
    }
    
    try {
      const schedule = await updateSchedule(id, updates);
      
      return reply.send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'SCHEDULE_NOT_FOUND',
              message: `Schedule "${id}" not found`
            }
          ]
        });
      }
      
      return reply.code(400).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_UPDATE_FAILED',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Delete a schedule
   */
  fastify.delete('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const deleted = await deleteSchedule(id);
      
      if (!deleted) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'SCHEDULE_NOT_FOUND',
              message: `Schedule "${id}" not found`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          id,
          message: 'Schedule deleted successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_DELETION_FAILED',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Enable a schedule
   */
  fastify.post('/:id/enable', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const schedule = await enableSchedule(id);
      
      return reply.send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'SCHEDULE_NOT_FOUND',
              message: `Schedule "${id}" not found`
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_ENABLE_FAILED',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Disable a schedule
   */
  fastify.post('/:id/disable', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const schedule = await disableSchedule(id);
      
      return reply.send({
        data: schedule,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'SCHEDULE_NOT_FOUND',
              message: `Schedule "${id}" not found`
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_DISABLE_FAILED',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Run a schedule immediately
   */
  fastify.post('/:id/run', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const jobId = await runScheduleNow(id);
      
      return reply.send({
        data: {
          scheduleId: id,
          jobId,
          message: 'Schedule executed successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'SCHEDULE_NOT_FOUND',
              message: `Schedule "${id}" not found`
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SCHEDULE_EXECUTION_FAILED',
            message: (error as Error).message
          }
        ]
      });
    }
  });
}
