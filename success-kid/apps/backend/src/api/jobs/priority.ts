/**
 * Job Priority Routes
 * 
 * API endpoints for managing job priorities.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  registerPriorityPolicy, 
  calculateJobPriority, 
  updateJobPriority, 
  getPriorityPolicies, 
  PriorityPolicy, 
  PriorityLevel 
} from '../../jobs/priority';
import { logger } from '../../lib/logger';

/**
 * Register job priority routes
 * 
 * @param fastify Fastify instance
 */
export default async function priorityRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get all priority policies
   */
  fastify.get('/policies', async (request, reply) => {
    try {
      const policies = getPriorityPolicies();
      
      // Remove function for JSON serialization
      const sanitizedPolicies = policies.map(policy => ({
        queue: policy.queue,
        jobName: policy.jobName,
        description: policy.description,
        // Include function as string for documentation
        calculatePriorityStr: policy.calculatePriority.toString()
      }));
      
      return reply.send({
        data: sanitizedPolicies,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting priority policies', { error });
      throw error;
    }
  });
  
  /**
   * Register a priority policy
   */
  fastify.post('/policies', async (request: FastifyRequest<{
    Body: {
      queue: string,
      jobName: string,
      description: string,
      calculatePriorityStr: string
    }
  }>, reply) => {
    const { queue, jobName, description, calculatePriorityStr } = request.body;
    
    try {
      // Convert string function to actual function
      const calculatePriority = new Function(
        'data', 
        calculatePriorityStr
      ) as (data: any) => number;
      
      // Create policy
      const policy: PriorityPolicy = {
        queue,
        jobName,
        description,
        calculatePriority
      };
      
      // Register policy
      registerPriorityPolicy(policy);
      
      return reply.code(201).send({
        data: {
          queue,
          jobName,
          description,
          message: 'Priority policy registered successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error registering priority policy', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  });
  
  /**
   * Calculate priority for a job
   */
  fastify.post('/calculate', async (request: FastifyRequest<{
    Body: {
      queue: string,
      jobName: string,
      data: any
    }
  }>, reply) => {
    const { queue, jobName, data } = request.body;
    
    try {
      const priority = calculateJobPriority(queue, jobName, data);
      
      // Map priority to named level
      let priorityName = 'NORMAL';
      
      if (priority <= PriorityLevel.CRITICAL) {
        priorityName = 'CRITICAL';
      } else if (priority <= PriorityLevel.HIGH) {
        priorityName = 'HIGH';
      } else if (priority <= PriorityLevel.NORMAL) {
        priorityName = 'NORMAL';
      } else if (priority <= PriorityLevel.LOW) {
        priorityName = 'LOW';
      } else {
        priorityName = 'BULK';
      }
      
      return reply.send({
        data: {
          queue,
          jobName,
          priority,
          priorityName,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error calculating job priority', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  });
  
  /**
   * Update job priority
   */
  fastify.put('/:queue/:jobId', async (request: FastifyRequest<{
    Params: {
      queue: string,
      jobId: string
    },
    Body: {
      priority: number
    }
  }>, reply) => {
    const { queue, jobId } = request.params;
    const { priority } = request.body;
    
    try {
      const job = await updateJobPriority(queue, jobId, priority);
      
      if (!job) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'JOB_NOT_FOUND',
              message: `Job "${jobId}" not found in queue "${queue}"`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          queue,
          jobId,
          priority,
          message: 'Job priority updated successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error updating job priority', { 
        error, 
        queue, 
        jobId, 
        priority 
      });
      throw error;
    }
  });
  
  /**
   * Get priority levels
   */
  fastify.get('/levels', async (request, reply) => {
    return reply.send({
      data: {
        levels: PriorityLevel,
        timestamp: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
}
