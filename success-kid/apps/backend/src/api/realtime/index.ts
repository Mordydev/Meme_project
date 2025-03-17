/**
 * Realtime API Routes
 * 
 * Provides fallback HTTP endpoints for real-time communication
 * when WebSockets are unavailable.
 */
import { FastifyPluginAsync } from 'fastify';
import { WebSocketService } from '../../websockets/websocket-service';
import { EventBus } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { getDbClient } from '../../lib/db-client';
import fp from 'fastify-plugin';

/**
 * Maximum number of events to return in a single poll
 */
const MAX_EVENTS_PER_POLL = 50;

/**
 * Maximum number of events in a batch request
 */
const MAX_BATCH_EVENTS = 100;

/**
 * Default polling timeout in seconds
 */
const DEFAULT_POLL_TIMEOUT = 30;

/**
 * Register realtime API routes
 * @param fastify Fastify instance
 */
const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbClient();
  
  /**
   * GET /api/realtime/poll
   * Poll for new events (long-polling fallback)
   */
  fastify.get('/poll', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'string' },
          types: { type: 'string' },
          timeout: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  data: { type: 'object' },
                  timestamp: { type: 'string' }
                }
              }
            },
            lastEventId: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { since, types, timeout = DEFAULT_POLL_TIMEOUT } = request.query as any;
        
        // Get user ID from authenticated session
        const userId = request.user?.id;
        
        // Parse requested event types
        let eventTypes: string[] = [];
        if (types) {
          eventTypes = types.split(',');
        }
        
        // Get events since the last event ID
        const events = await getEventsSince(since, eventTypes, userId, timeout);
        
        // Get the ID of the last event
        const lastEventId = events.length > 0
          ? events[events.length - 1].id
          : since || null;
        
        // Return events
        return {
          events,
          lastEventId
        };
      } catch (error) {
        logger.error('Error handling poll request', { error });
        reply.code(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while processing your request'
        });
      }
    }
  });
  
  /**
   * POST /api/realtime/batch
   * Process batch of events from offline client
   */
  fastify.post('/batch', {
    schema: {
      body: {
        type: 'object',
        required: ['events'],
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string' },
                payload: { type: 'object' },
                id: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            processed: { type: 'number' },
            failed: { type: 'number' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  success: { type: 'boolean' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { events } = request.body as any;
        
        // Get user ID from authenticated session
        const userId = request.user?.id;
        
        // Limit number of events in a batch
        const limitedEvents = events.slice(0, MAX_BATCH_EVENTS);
        
        // Process events
        const results = await processBatchEvents(limitedEvents, userId);
        
        // Count successes and failures
        const processed = results.filter(r => r.success).length;
        const failed = results.length - processed;
        
        // Return results
        return {
          processed,
          failed,
          results
        };
      } catch (error) {
        logger.error('Error handling batch request', { error });
        reply.code(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while processing your request'
        });
      }
    }
  });
  
  /**
   * GET /api/realtime/status
   * Get realtime subsystem status
   */
  fastify.get('/status', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            websocket: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                connections: { type: 'number' },
                authenticatedUsers: { type: 'number' }
              }
            },
            events: {
              type: 'object',
              properties: {
                queueSize: { type: 'number' },
                processedLast24h: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        // Get WebSocket service stats
        const websocketService = fastify.websockets as WebSocketService;
        const wsStats = websocketService ? websocketService.getStats() : null;
        
        // Get event bus stats
        const eventBus = fastify.eventBus as EventBus;
        const eventStats = eventBus ? {
          activeSubscriptions: eventBus.getActiveSubscriptions().length,
          subscriberCounts: eventBus.getSubscriberCounts()
        } : null;
        
        // Return status
        return {
          websocket: wsStats ? {
            enabled: true,
            connections: wsStats.totalConnections,
            authenticatedUsers: wsStats.authenticatedUsers
          } : {
            enabled: false,
            connections: 0,
            authenticatedUsers: 0
          },
          events: eventStats ? {
            activeSubscriptions: eventStats.activeSubscriptions,
            subscriberCounts: eventStats.subscriberCounts
          } : {
            activeSubscriptions: 0,
            subscriberCounts: {}
          }
        };
      } catch (error) {
        logger.error('Error handling status request', { error });
        reply.code(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while processing your request'
        });
      }
    }
  });
  
  /**
   * Get events since a specific ID
   * @param since Last event ID
   * @param types Event types to include
   * @param userId User ID for filtered events
   * @param timeout Long-polling timeout in seconds
   * @returns Array of events
   */
  async function getEventsSince(
    since?: string,
    types: string[] = [],
    userId?: string,
    timeout: number = DEFAULT_POLL_TIMEOUT
  ): Promise<any[]> {
    try {
      // TODO: Implement real event retrieval from database or cache
      // This is a simplified example that returns mock events
      
      // In a production implementation, this would:
      // 1. Query the event store for events after the "since" cursor
      // 2. Filter by types if specified
      // 3. Filter by user permission
      // 4. Apply long polling with timeout if no events found
      
      // Mock implementation
      return [
        {
          id: `evt_${Date.now().toString(36)}`,
          type: 'notification.new',
          data: {
            title: 'New notification',
            body: 'This is a test notification',
            priority: 'normal'
          },
          timestamp: new Date().toISOString()
        }
      ];
    } catch (error) {
      logger.error('Error getting events since', { error, since, types, userId });
      return [];
    }
  }
  
  /**
   * Process batch of events from offline client
   * @param events Events to process
   * @param userId User ID
   * @returns Results of processing each event
   */
  async function processBatchEvents(events: any[], userId?: string): Promise<any[]> {
    // Results array
    const results: any[] = [];
    
    // Process each event
    for (const event of events) {
      try {
        const { type, payload, id } = event;
        
        // Skip invalid events
        if (!type) {
          results.push({
            id: id || 'unknown',
            success: false,
            error: 'Missing event type'
          });
          continue;
        }
        
        // TODO: Process event based on type
        // This would call the appropriate service methods
        // based on the event type
        
        // For now, just log the event
        logger.info('Processing offline event', { type, id, userId });
        
        // Add success result
        results.push({
          id: id || 'unknown',
          success: true
        });
      } catch (error) {
        // Log error
        logger.error('Error processing batch event', { error, event, userId });
        
        // Add failure result
        results.push({
          id: event.id || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
};

export default fp(realtimeRoutes);
