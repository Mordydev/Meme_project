/**
 * Job Monitoring Routes
 * 
 * API routes for job monitoring
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { metricsService } from '../monitoring/metrics';
import { alertService, AlertType, AlertSeverity } from '../monitoring/alerts';
import { dashboardService } from '../monitoring/dashboard';
import { QueueName } from '../queues';

// Validation schemas
const queueNameSchema = z.enum([
  QueueName.POINTS,
  QueueName.CONTENT,
  QueueName.MEDIA,
  QueueName.NOTIFICATIONS
]);

const alertThresholdSchema = z.object({
  metric: z.string(),
  threshold: z.number(),
  type: z.nativeEnum(AlertType),
  severity: z.nativeEnum(AlertSeverity),
  message: z.string().optional(),
  comparison: z.enum(['gt', 'lt']).optional()
});

// Job monitoring routes
const monitoringRoutes: FastifyPluginAsync = async (fastify) => {
  // Get dashboard data
  fastify.get('/jobs/dashboard', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                overview: {
                  type: 'object',
                  properties: {
                    totalQueues: { type: 'number' },
                    healthSummary: {
                      type: 'object',
                      properties: {
                        healthy: { type: 'number' },
                        warning: { type: 'number' },
                        critical: { type: 'number' },
                        unknown: { type: 'number' }
                      }
                    },
                    totalActiveJobs: { type: 'number' },
                    totalWaitingJobs: { type: 'number' },
                    totalProcessedJobs: { type: 'number' },
                    errorRate: { type: 'number' },
                    alertsCount: { type: 'number' }
                  }
                },
                queueHealth: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      queue: { type: 'string' },
                      status: { type: 'string' },
                      metrics: { type: 'object' },
                      activeAlerts: { type: 'array' }
                    }
                  }
                },
                performanceTrends: {
                  type: 'object',
                  properties: {
                    throughputTrend: { type: 'array' },
                    errorRateTrend: { type: 'array' },
                    processingTimeTrend: { type: 'array' }
                  }
                },
                recentAlerts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      message: { type: 'string' },
                      severity: { type: 'string' },
                      queueName: { type: 'string' },
                      timestamp: { type: 'string' },
                      acknowledged: { type: 'boolean' }
                    }
                  }
                },
                timestamp: { type: 'string' }
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
      const dashboardData = await dashboardService.getDashboardData();
      
      return reply.status(200).send({
        data: dashboardData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get dashboard data', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get dashboard data',
          details: error.message
        }]
      });
    }
  });
  
  // Get queue metrics
  fastify.get('/jobs/metrics/:queue', {
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
                metrics: {
                  type: 'object',
                  properties: {
                    queue: { type: 'string' },
                    completed: { type: 'number' },
                    failed: { type: 'number' },
                    delayed: { type: 'number' },
                    active: { type: 'number' },
                    waiting: { type: 'number' },
                    throughput: { type: 'number' },
                    averageProcessingTime: { type: 'number' },
                    errorRate: { type: 'number' },
                    totalProcessed: { type: 'number' },
                    waitTime: { type: 'number' },
                    timestamp: { type: 'string' }
                  }
                },
                history: {
                  type: 'object',
                  properties: {
                    queue: { type: 'string' },
                    metrics: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'string' },
                          completed: { type: 'number' },
                          failed: { type: 'number' },
                          throughput: { type: 'number' },
                          averageProcessingTime: { type: 'number' },
                          errorRate: { type: 'number' }
                        }
                      }
                    }
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
  }, async (request: FastifyRequest<{ Params: { queue: string } }>, reply: FastifyReply) => {
    try {
      const { queue } = request.params;
      
      // Validate queue name
      try {
        queueNameSchema.parse(queue);
      } catch (error) {
        return reply.status(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [{
            code: 'VALIDATION_ERROR',
            message: 'Invalid queue name',
            details: error.message
          }]
        });
      }
      
      // Get current metrics
      const metricsMap = await metricsService.getCurrentMetrics();
      const metrics = metricsMap.get(queue);
      
      // Get historical metrics
      const history = await metricsService.getHistoricalMetrics(queue as QueueName);
      
      // Return response
      return reply.status(200).send({
        data: {
          metrics,
          history
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get queue metrics', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get queue metrics',
          details: error.message
        }]
      });
    }
  });
  
  // Get alerts
  fastify.get('/jobs/alerts', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          acknowledged: { type: 'boolean' },
          limit: { type: 'number' }
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
                  type: { type: 'string' },
                  message: { type: 'string' },
                  severity: { type: 'string' },
                  queueName: { type: 'string' },
                  metrics: { type: 'object' },
                  timestamp: { type: 'string' },
                  acknowledged: { type: 'boolean' }
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
    Querystring: { acknowledged?: boolean; limit?: number }
  }>, reply: FastifyReply) => {
    try {
      const { acknowledged = false, limit = 100 } = request.query;
      
      // Get alerts
      const alerts = await alertService.getAlerts(acknowledged, limit);
      
      // Return response
      return reply.status(200).send({
        data: alerts,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get alerts', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get alerts',
          details: error.message
        }]
      });
    }
  });
  
  // Acknowledge alert
  fastify.post('/jobs/alerts/:alertId/acknowledge', {
    schema: {
      params: {
        type: 'object',
        required: ['alertId'],
        properties: {
          alertId: { type: 'string' }
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
  }, async (request: FastifyRequest<{ Params: { alertId: string } }>, reply: FastifyReply) => {
    try {
      const { alertId } = request.params;
      
      // Acknowledge alert
      const success = await alertService.acknowledgeAlert(alertId);
      
      // Return response
      return reply.status(200).send({
        data: { success },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to acknowledge alert', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to acknowledge alert',
          details: error.message
        }]
      });
    }
  });
  
  // Set alert threshold
  fastify.post('/jobs/alerts/thresholds', {
    schema: {
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['metric', 'threshold', 'type', 'severity'],
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'number' },
              type: { type: 'string' },
              severity: { type: 'string' },
              message: { type: 'string' },
              comparison: { type: 'string' }
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
    Body: { data: z.infer<typeof alertThresholdSchema> }
  }>, reply: FastifyReply) => {
    try {
      const { data } = request.body;
      
      // Validate threshold data
      alertThresholdSchema.parse(data);
      
      // Set threshold
      await alertService.setAlertThreshold(
        data.metric,
        data.threshold,
        data.type,
        data.severity,
        data.message,
        data.comparison as any
      );
      
      // Return response
      return reply.status(200).send({
        data: { success: true },
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
            message: 'Invalid threshold data',
            details: error.errors
          }]
        });
      }
      
      request.log.error('Failed to set alert threshold', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to set alert threshold',
          details: error.message
        }]
      });
    }
  });
  
  // Get alert thresholds
  fastify.get('/jobs/alerts/thresholds', {
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
                  metric: { type: 'string' },
                  threshold: { type: 'number' },
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  message: { type: 'string' },
                  comparison: { type: 'string' }
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
      // Get thresholds
      const thresholds = await alertService.getAlertThresholds();
      
      // Return response
      return reply.status(200).send({
        data: thresholds,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.error('Failed to get alert thresholds', error);
      return reply.status(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get alert thresholds',
          details: error.message
        }]
      });
    }
  });
};

export default monitoringRoutes;
