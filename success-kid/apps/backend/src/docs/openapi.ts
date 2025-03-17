/**
 * OpenAPI Configuration
 */
import { OpenAPIObject } from 'openapi3-ts';

/**
 * Generates the OpenAPI configuration for the application
 */
export function getOpenApiConfig(): OpenAPIObject {
  return {
    info: {
      title: 'Success Kid Community API',
      description: 'API for the Success Kid Community Platform',
      version: process.env.npm_package_version || '1.0.0',
      contact: {
        name: 'API Support',
        url: 'https://github.com/your-org/success-kid-platform/issues',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'API Server',
      },
      {
        url: 'https://api-staging.successkid.com',
        description: 'Staging server',
      },
      {
        url: 'https://api.successkid.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Core schemas are imported from the schemas directory
      },
      responses: {
        Error400: {
          description: 'Bad Request - Validation Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Error401: {
          description: 'Unauthorized - Authentication Required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Error403: {
          description: 'Forbidden - Insufficient Permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Error404: {
          description: 'Not Found - Resource Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Error429: {
          description: 'Too Many Requests - Rate Limit Exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Error500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Authentication and authorization endpoints' },
      { name: 'Users', description: 'User-related endpoints' },
      { name: 'Points', description: 'Points system endpoints' },
      { name: 'Content', description: 'Content management endpoints' },
      { name: 'Wallet', description: 'Wallet integration endpoints' },
      { name: 'Leaderboards', description: 'Leaderboard endpoints' },
      { name: 'Achievements', description: 'User achievements endpoints' },
      { name: 'System', description: 'System status and health endpoints' },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  };
}
