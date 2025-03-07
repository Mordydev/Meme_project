import { FastifyInstance } from 'fastify'
import { authenticate } from '../../../middleware/auth'

/**
 * User profile routes
 */
export default async function (fastify: FastifyInstance) {
  /**
   * Get current user profile
   */
  fastify.get(
    '/api/users/profile',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  // Add other user properties as needed
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // Get user data from Clerk
      const user = await fastify.clerk.users.getUser(request.userId);
      
      // Return user profile data
      return {
        data: {
          userId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          username: user.username,
          // Add additional fields as needed
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );
  
  /**
   * Update current user profile
   */
  fastify.patch(
    '/api/users/profile',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            bio: { type: 'string' },
            // Add other updatable fields
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  updated: { type: 'boolean' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { displayName, bio } = request.body as any;
      
      // Update user data in your database
      // This is a placeholder - implement actual user data storage
      
      // You can also update Clerk user metadata if needed
      await fastify.clerk.users.updateUser(request.userId, {
        firstName: displayName.split(' ')[0],
        lastName: displayName.split(' ').slice(1).join(' '),
        // Can also update publicMetadata or privateMetadata
        publicMetadata: {
          ...user.publicMetadata,
          bio,
        },
      });
      
      return {
        data: {
          userId: request.userId,
          updated: true,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );
}
