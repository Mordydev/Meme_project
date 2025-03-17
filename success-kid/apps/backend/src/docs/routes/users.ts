/**
 * User route schemas for API documentation
 */
import { FastifyInstance } from 'fastify';

/**
 * Register user route schemas
 */
export function userRoutes(fastify: FastifyInstance): void {
  // User response for GET /users/me
  fastify.addSchema({
    $id: 'userProfileResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          display_name: {
            type: 'string',
            description: 'User display name',
          },
          profile_image: {
            type: 'string',
            format: 'uri',
            description: 'User profile image URL',
          },
          level: {
            type: 'integer',
            description: 'User level',
          },
          title: {
            type: 'string',
            description: 'User title',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp',
          },
        },
        required: ['id', 'display_name', 'created_at'],
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
  
  // Update user profile request for PUT /users/me
  fastify.addSchema({
    $id: 'updateUserProfileRequest',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          display_name: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'User display name',
          },
          bio: {
            type: 'string',
            maxLength: 500,
            description: 'User biography',
          },
          profile_image: {
            type: 'string',
            format: 'uri',
            description: 'User profile image URL',
          },
          title: {
            type: 'string',
            maxLength: 100,
            description: 'User title',
          },
        },
        required: [],
      },
    },
    required: ['data'],
  });
  
  // User list response for GET /users
  fastify.addSchema({
    $id: 'userListResponse',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            display_name: {
              type: 'string',
              description: 'User display name',
            },
            profile_image: {
              type: 'string',
              format: 'uri',
              description: 'User profile image URL',
            },
            level: {
              type: 'integer',
              description: 'User level',
            },
            title: {
              type: 'string',
              description: 'User title',
            },
          },
          required: ['id', 'display_name'],
        },
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
      pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number',
          },
          pageSize: {
            type: 'integer',
            description: 'Number of items per page',
          },
          totalItems: {
            type: 'integer',
            description: 'Total number of items',
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
          },
        },
        required: ['page', 'pageSize', 'totalItems', 'totalPages'],
      },
    },
    required: ['data', 'meta', 'pagination'],
  });
}
