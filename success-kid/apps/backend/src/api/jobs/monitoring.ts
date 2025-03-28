/**
 * Job Monitoring Routes
 * 
 * API endpoints for monitoring and alerting for background jobs.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  getQueueMetrics, 
  getAllQueueMetrics, 
  setAlertThreshold, 
  getAlerts, 
  acknowledgeAlert, 
  getDashboardData,
  AlertSeverity,
  MetricType,
  ThresholdOperator
} from '../../jobs/monitoring';
import { logger } from '../../lib/logger';

/**
 * Register monitoring routes
 * 
 * @param fastify Fastify instance
 */
export default async function monitoringRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get dashboard data
   */
  fastify.get('/dashboard', async (request, reply) => {
    try {
      const data = await getDashboardData();
      
      return reply.send({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting dashboard data', { error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'DASHBOARD_ERROR',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Get metrics for all queues
   */
  fastify.get('/metrics', async (request, reply) => {
    try {
      const metrics = await getAllQueueMetrics();
      
      return reply.send({
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting queue metrics', { error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'METRICS_ERROR',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Get metrics for a specific queue
   */
  fastify.get('/metrics/:queue', async (request: FastifyRequest<{
    Params: { queue: string }
  }>, reply) => {
    const { queue } = request.params;
    
    try {
      const metrics = await getQueueMetrics(queue);
      
      if (!metrics) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      return reply.send({
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting queue metrics', { queue, error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'METRICS_ERROR',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Get all alerts
   */
  fastify.get('/alerts', async (request: FastifyRequest<{
    Querystring: { status?: string }
  }>, reply) => {
    try {
      // Filter by status if provided
      const status = request.query.status;
      const alerts = getAlerts(status ? [status as any] : undefined);
      
      return reply.send({
        data: alerts,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting alerts', { error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'ALERTS_ERROR',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Acknowledge an alert
   */
  fastify.post('/alerts/:id/acknowledge', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const alert = await acknowledgeAlert(id);
      
      if (!alert) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'ALERT_NOT_FOUND',
              message: `Alert "${id}" not found`
            }
          ]
        });
      }
      
      return reply.send({
        data: alert,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error acknowledging alert', { alertId: id, error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'ALERT_ACKNOWLEDGE_ERROR',
            message: (error as Error).message
          }
        ]
      });
    }
  });
  
  /**
   * Create or update an alert threshold
   */
  fastify.post('/thresholds', async (request: FastifyRequest<{
    Body: {
      queue: string,
      metric: MetricType,
      operator: ThresholdOperator,
      value: number,
      severity: AlertSeverity,
      minConsecutiveBreaches?: number,
      enabled?: boolean
    }
  }>, reply) => {
    const { 
      queue, 
      metric, 
      operator, 
      value, 
      severity, 
      minConsecutiveBreaches = 1, 
      enabled = true 
    } = request.body;
    
    try {
      const threshold = await setAlertThreshold(queue, metric, {
        operator,
        value,
        severity,
        minConsecutiveBreaches,
        enabled
      });
      
      return reply.send({
        data: threshold,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error setting alert threshold', { error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'THRESHOLD_ERROR',
            message: (error as Error).message
          }
        ]
      });
    }
  });
}
