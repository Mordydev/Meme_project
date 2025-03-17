/**
 * User Route Schemas
 * 
 * OpenAPI route schemas for user-related endpoints
 */
import { FastifyInstance } from 'fastify';

/**
 * Register schemas for user routes
 * @param fastify Fastify instance
 */
export function userRouteSchemas(fastify: FastifyInstance): void {
  // POST /api/v1/auth/register
  fastify.addSchema({
    $id: 'registerUserSchema',
    schema: {
      summary: 'Register a new user',
      description: 'Creates a new user account',
      tags: ['Auth'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'userRegistration#' },
          },
        },
      },
      response: {
        200: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'authResponse#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        409: {
          description: 'User already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  });

  // POST /api/v1/auth/login
  fastify.addSchema({
    $id: 'loginUserSchema',
    schema: {
      summary: 'Log in user',
      description: 'Authenticate a user and get access token',
      tags: ['Auth'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'userLogin#' },
          },
        },
      },
      response: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'authResponse#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  });

  // GET /api/v1/users/me
  fastify.addSchema({
    $id: 'getCurrentUserSchema',
    schema: {
      summary: 'Get current user profile',
      description: 'Retrieves the profile of the authenticated user',
      tags: ['Users'],
      response: {
        200: {
          description: 'User profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'userProfile#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // GET /api/v1/users/:id/profile
  fastify.addSchema({
    $id: 'getUserProfileSchema',
    schema: {
      summary: 'Get user profile',
      description: 'Retrieves the profile of a specific user',
      tags: ['Users'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'User profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'userProfile#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
  });

  // PATCH /api/v1/users/me
  fastify.addSchema({
    $id: 'updateProfileSchema',
    schema: {
      summary: 'Update user profile',
      description: 'Updates the profile of the authenticated user',
      tags: ['Users'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'profileUpdate#' },
          },
        },
      },
      response: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'userProfile#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
      security: [{ bearerAuth: [] }],
    },
  });
}
