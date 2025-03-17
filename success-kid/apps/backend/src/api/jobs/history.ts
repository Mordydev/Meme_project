/**
 * Job History Routes
 * 
 * API endpoints for job history and analytics.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  getJobHistory, 
  generateJobAnalytics, 
  purgeOldHistory as purgeOldRecords, 
  JobHistoryQuery, 
  AnalyticsOptions, 
  AggregationType 
} from '../../jobs/history';
import { logger } from '../../lib/logger';

/**
 * Register job history routes
 * 
 * @param fastify Fastify instance
 */
export default async function historyRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get job history
   */
  fastify.get('/', async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      pageSize?: number;
      queue?: string;
      jobName?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
      sortBy?: string;
      sortDirection?: string;
    }
  }>, reply) => {
    try {
      const query: JobHistoryQuery = {
        page: request.query.page || 1,
        pageSize: request.query.pageSize || 20,
        filters: {}
      };
      
      // Add filters if provided
      if (request.query.queue) {
        query.filters.queue = request.query.queue;
      }
      
      if (request.query.jobName) {
        query.filters.name = request.query.jobName;
      }
      
      if (request.query.status) {
        query.filters.status = request.query.status as 'completed' | 'failed' | 'cancelled';
      }
      
      if (request.query.startTime) {
        query.filters.startTime = new Date(request.query.startTime);
      }
      
      if (request.query.endTime) {
        query.filters.endTime = new Date(request.query.endTime);
      }
      
      // Add sorting if provided
      if (request.query.sortBy) {
        query.sort = {
          field: request.query.sortBy,
          direction: (request.query.sortDirection === 'desc' ? 'desc' : 'asc')
        };
      }
      
      const history = await getJobHistory(query);
      
      return reply.send({
        data: history.entries,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          page: history.page,
          pageSize: history.pageSize,
          totalItems: history.totalItems,
          totalPages: history.totalPages
        }
      });
    } catch (error) {
      logger.error('Error getting job history', { error, query: request.query });
      throw error;
    }
  });
  
  /**
   * Generate job analytics
   */
  fastify.get('/analytics', async (request: FastifyRequest<{
    Querystring: {
      startTime?: string;
      endTime?: string;
      queues?: string;
      jobNames?: string;
      aggregation?: string;
    }
  }>, reply) => {
    try {
      // Parse query parameters
      const now = new Date();
      const startTime = request.query.startTime 
        ? new Date(request.query.startTime) 
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
      
      const endTime = request.query.endTime 
        ? new Date(request.query.endTime) 
        : now;
      
      const queues = request.query.queues 
        ? request.query.queues.split(',') 
        : undefined;
      
      const names = request.query.jobNames 
        ? request.query.jobNames.split(',') 
        : undefined;
      
      // Parse aggregation type
      let aggregationType = AggregationType.HOUR;
      
      if (request.query.aggregation) {
        switch (request.query.aggregation.toLowerCase()) {
          case 'minute':
            aggregationType = AggregationType.MINUTE;
            break;
          case 'hour':
            aggregationType = AggregationType.HOUR;
            break;
          case 'day':
            aggregationType = AggregationType.DAY;
            break;
          case 'week':
            aggregationType = AggregationType.WEEK;
            break;
          case 'month':
            aggregationType = AggregationType.MONTH;
            break;
        }
      }
      
      // Create options
      const options: AnalyticsOptions = {
        timeRange: {
          startTime,
          endTime
        },
        queues,
        names,
        aggregationType
      };
      
      const analytics = await generateJobAnalytics(options);
      
      return reply.send({
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error generating job analytics', { error, query: request.query });
      throw error;
    }
  });
  
  /**
   * Purge old job history records
   */
  fastify.delete('/', async (request: FastifyRequest<{
    Querystring: {
      olderThan?: string;
    }
  }>, reply) => {
    try {
      // Default to 30 days
      const olderThanDays = parseInt(request.query.olderThan || '30', 10);
      
      // Convert to milliseconds
      const maxAge = olderThanDays * 24 * 60 * 60 * 1000;
      
      const count = await purgeOldRecords(maxAge);
      
      return reply.send({
        data: {
          recordsPurged: count,
          olderThanDays,
          message: `Purged ${count} history records older than ${olderThanDays} days`,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error purging job history', { error, olderThan: request.query.olderThan });
      throw error;
    }
  });
  
  /**
   * Get job execution times
   */
  fastify.get('/execution-times', async (request: FastifyRequest<{
    Querystring: {
      queue?: string;
      jobName?: string;
      days?: string;
    }
  }>, reply) => {
    try {
      // Parse query parameters
      const queue = request.query.queue;
      const jobName = request.query.jobName;
      const days = parseInt(request.query.days || '7', 10);
      
      // This is a simplified endpoint - in a real system, we would
      // implement this with actual data aggregation
      // For now, return mock data
      const mockData = {
        queue: queue || 'all',
        jobName: jobName || 'all',
        timeRange: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        executionTimes: {
          average: 152.3,
          p95: 287.6,
          p99: 342.1,
          min: 42.8,
          max: 532.4
        },
        byJobType: [
          {
            name: 'points-award',
            average: 124.5,
            count: 1250
          },
          {
            name: 'redemption-process',
            average: 342.8,
            count: 320
          }
        ]
      };
      
      return reply.send({
        data: mockData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting job execution times', { error, query: request.query });
      throw error;
    }
  });
}
