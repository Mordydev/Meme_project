/**
 * Media API Routes
 * 
 * Defines API endpoints for media uploads, retrieval, and management.
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { mediaRoutes } from './media-routes';
import { uploadRoutes } from './upload-routes';

/**
 * Media API plugin
 */
const mediaApiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register routes
  fastify.register(mediaRoutes);
  fastify.register(uploadRoutes);
  
  // Register route documentation
  fastify.get('/', {
    schema: {
      description: 'Media API endpoints',
      tags: ['media'],
      response: {
        200: {
          description: 'Success response',
          type: 'object',
          properties: {
            status: { type: 'string' },
            routes: { 
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async () => {
      return {
        status: 'ok',
        routes: [
          '/media/upload',
          '/media/{id}',
          '/media/user/{userId}',
          '/media/presigned-url'
        ]
      };
    }
  });
};

export default fp(mediaApiPlugin);
