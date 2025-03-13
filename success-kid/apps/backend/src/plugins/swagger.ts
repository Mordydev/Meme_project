import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Success Kid Community API',
        description: 'API for the Success Kid Community Platform',
        version: '1.0.0',
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
          url: 'http://localhost:3001',
          description: 'Local development server',
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
          Error: {
            type: 'object',
            properties: {
              data: {
                type: 'null',
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
              },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'string',
                    },
                    message: {
                      type: 'string',
                    },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        additionalProperties: true,
                      },
                    },
                  },
                },
              },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', format: 'email' },
              displayName: { type: 'string' },
              profileImageUrl: { type: 'string', format: 'uri' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Points: {
            type: 'object',
            properties: {
              balance: { type: 'number' },
              transactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    amount: { type: 'number' },
                    source: { type: 'string' },
                    referenceId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          Content: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              type: { type: 'string', enum: ['text', 'image', 'link', 'poll'] },
              title: { type: 'string' },
              content: { type: 'string' },
              mediaUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['active', 'deleted', 'flagged'] },
            },
          },
        },
      },
      tags: [
        { name: 'Users', description: 'User-related endpoints' },
        { name: 'Points', description: 'Points system endpoints' },
        { name: 'Content', description: 'Content management endpoints' },
        { name: 'Wallet', description: 'Wallet integration endpoints' },
      ],
    },
  });
  
  // Register Swagger UI
  await fastify.register(swaggerUi, {
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
  });
});
