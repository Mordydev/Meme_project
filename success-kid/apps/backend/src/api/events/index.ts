/**
 * Event publishing endpoints
 * For testing real-time functionality
 */
import { FastifyInstance } from 'fastify';
import { eventBus, EventType } from '../../lib/event-bus';

export default async function routes(fastify: FastifyInstance) {
  // This endpoint should only be available in development
  if (process.env.NODE_ENV !== 'production') {
    // Publish an event (development only)
    fastify.post('/publish', {
      schema: {
        description: 'Publish a test event',
        tags: ['events'],
        summary: 'Publish a test event for development purposes',
        body: {
          type: 'object',
          required: ['type', 'data'],
          properties: {
            type: { type: 'string', description: 'Event type' },
            data: { type: 'object', description: 'Event data' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
      handler: async (request, reply) => {
        const { type, data } = request.body as { type: string; data: any };
        
        try {
          await eventBus.publish(type, data);
          
          return {
            success: true,
            message: `Event ${type} published successfully`,
          };
        } catch (error) {
          request.log.error('Error publishing event', error);
          
          return {
            success: false,
            message: `Error publishing event: ${error.message}`,
          };
        }
      },
    });
    
    // Simulate preset events (development only)
    fastify.post('/simulate/:eventType', {
      schema: {
        description: 'Simulate a predefined event',
        tags: ['events'],
        summary: 'Simulate a predefined event for development purposes',
        params: {
          type: 'object',
          required: ['eventType'],
          properties: {
            eventType: { 
              type: 'string', 
              enum: [
                'points.awarded',
                'achievement.unlocked',
                'content.created',
                'milestone.reached'
              ] 
            },
          },
        },
        body: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'Target user ID (if applicable)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
      handler: async (request, reply) => {
        const { eventType } = request.params as { eventType: string };
        const { userId = 'user_123' } = request.body as { userId?: string };
        
        let eventData: any = {};
        
        switch (eventType) {
          case 'points.awarded':
            eventData = {
              userId,
              amount: Math.floor(Math.random() * 50) + 10,
              source: ['post_creation', 'comment', 'daily_login', 'achievement'][Math.floor(Math.random() * 4)],
            };
            break;
            
          case 'achievement.unlocked':
            eventData = {
              userId,
              achievement: {
                id: `achievement_${Date.now()}`,
                name: ['First Post', 'Conversation Starter', 'Daily Devotion'][Math.floor(Math.random() * 3)],
                description: 'Achievement description',
                image: '/images/achievement.png',
              },
            };
            break;
            
          case 'content.created':
            eventData = {
              id: `content_${Date.now()}`,
              author: ['Alice', 'Bob', 'Charlie'][Math.floor(Math.random() * 3)],
              preview: 'This is a preview of the content...',
              type: ['post', 'image', 'link'][Math.floor(Math.random() * 3)],
            };
            break;
            
          case 'milestone.reached':
            eventData = {
              milestone: ['$100,000 Market Cap', '$500,000 Market Cap', '$1,000,000 Market Cap'][Math.floor(Math.random() * 3)],
              value: ['$100,000', '$500,000', '$1,000,000'][Math.floor(Math.random() * 3)],
            };
            break;
            
          default:
            return {
              success: false,
              message: 'Unknown event type',
            };
        }
        
        try {
          await eventBus.publish(eventType, eventData);
          
          return {
            success: true,
            message: `Event ${eventType} simulated successfully`,
            data: eventData,
          };
        } catch (error) {
          request.log.error('Error simulating event', error);
          
          return {
            success: false,
            message: `Error simulating event: ${error.message}`,
          };
        }
      },
    });
  }
}