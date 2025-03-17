/**
 * OpenAPI/Swagger configuration
 */
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { version } from '../../package.json';

/**
 * Swagger options for API documentation
 */
export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'Success Kid Community Platform API',
      description: 'API documentation for the Success Kid Community Platform',
      version,
      license: {
        name: 'Proprietary',
        url: ''
      },
      contact: {
        name: 'Success Kid Team',
        url: '',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Current environment API'
      },
      {
        url: 'https://api.successkit.example.com',
        description: 'Production API'
      },
      {
        url: 'https://api.staging.successkit.example.com',
        description: 'Staging API'
      }
    ],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management' },
      { name: 'profile', description: 'User profile operations' },
      { name: 'content', description: 'Content creation and management' },
      { name: 'points', description: 'Success Points operations' },
      { name: 'wallet', description: 'Wallet connections and operations' },
      { name: 'market', description: 'Market data and transactions' },
      { name: 'achievements', description: 'User achievements and progress' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: {
              type: 'string',
              description: 'Error code'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'object',
              nullable: true,
              description: 'Response data payload'
            },
            meta: {
              type: 'object',
              required: ['timestamp', 'requestId'],
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp'
                },
                requestId: {
                  type: 'string',
                  description: 'Unique request ID for tracing'
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Current page number'
                },
                pageSize: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Number of items per page'
                },
                totalItems: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of items'
                },
                totalPages: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of pages'
                }
              }
            },
            errors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Error'
              },
              description: 'Errors, if any'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'null' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' }
                    }
                  },
                  errors: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'null' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' }
                    }
                  },
                  errors: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'null' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' }
                    }
                  },
                  errors: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'null' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' }
                    }
                  },
                  errors: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'null' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' }
                    }
                  },
                  errors: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Swagger UI options for API documentation interface
 */
export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    tryItOutEnabled: true
  },
  theme: {
    title: 'Success Kid API Documentation',
    primaryColor: '#1E88E5',
    secondaryColor: '#FFC107',
    backgroundColor: '#F5F7FA',
    textColor: '#212121',
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
};

/**
 * Register OpenAPI/Swagger documentation with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function registerOpenApi(fastify: any): Promise<void> {
  // Register Swagger plugins
  await fastify.register(require('@fastify/swagger'), swaggerOptions);
  await fastify.register(require('@fastify/swagger-ui'), swaggerUiOptions);
  
  // Add route to redirect to documentation
  fastify.get('/api-docs', async (_, reply) => {
    return reply.redirect('/docs');
  });
  
  // Log documentation availability
  fastify.log.info('OpenAPI documentation available at /docs');
}
