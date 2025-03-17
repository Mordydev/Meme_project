/**
 * OpenAPI Configuration
 * 
 * Defines OpenAPI specification for API documentation
 */
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { version } from '../../package.json';

/**
 * Get OpenAPI configuration
 * @returns OpenAPI configuration
 */
export function getOpenApiConfig(): FastifyDynamicSwaggerOptions['openapi'] {
  return {
    info: {
      title: 'Success Kid Community Platform API',
      description: 'API for the Success Kid Community Platform',
      version,
      contact: {
        name: 'Success Kid Team',
        url: 'https://successcommunity.io',
      },
    },
    externalDocs: {
      url: 'https://docs.successcommunity.io',
      description: 'Full API documentation',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.successcommunity.io',
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
        // Common response schema
        ApiResponse: {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'object',
              description: 'Response data',
            },
            meta: {
              type: 'object',
              required: ['timestamp', 'requestId'],
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp',
                },
                requestId: {
                  type: 'string',
                  description: 'Unique request identifier',
                },
              },
            },
            pagination: {
              type: 'object',
              description: 'Pagination information (if applicable)',
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
            },
          },
        },
        
        // Standard error response
        ErrorResponse: {
          type: 'object',
          required: ['data', 'meta', 'errors'],
          properties: {
            data: {
              type: 'null',
              description: 'No data returned for errors',
            },
            meta: {
              type: 'object',
              required: ['timestamp', 'requestId'],
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp',
                },
                requestId: {
                  type: 'string',
                  description: 'Unique request identifier',
                },
              },
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                  code: {
                    type: 'string',
                    description: 'Error code',
                  },
                  message: {
                    type: 'string',
                    description: 'Error message',
                  },
                  details: {
                    type: 'array',
                    description: 'Detailed error information',
                    items: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
        
        // Add other common schemas here
      },
      responses: {
        // Standard error responses
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Content', description: 'Content management endpoints' },
      { name: 'Points', description: 'Points system endpoints' },
      { name: 'Wallet', description: 'Wallet integration endpoints' },
      { name: 'Market', description: 'Market data endpoints' },
      { name: 'Achievements', description: 'Achievement system endpoints' },
      { name: 'Leaderboard', description: 'Leaderboard endpoints' },
      { name: 'Referrals', description: 'Referral system endpoints' },
    ],
  };
}

/**
 * Get Swagger UI options
 * @returns Swagger UI options
 */
export function getSwaggerUiOptions(): FastifySwaggerUiOptions {
  return {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      filter: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  };
}
