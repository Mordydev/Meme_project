/**
 * OpenAPI Configuration
 * 
 * Defines the OpenAPI documentation configuration for the Success Kid Community Platform API.
 */
import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '../config';
import { getAppVersion } from '../health/checks';

/**
 * OpenAPI configuration interface
 */
export interface OpenApiConfig {
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      url: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  security?: Array<Record<string, string[]>>;
  tags: Array<{
    name: string;
    description: string;
  }>;
}

/**
 * Default OpenAPI configuration
 */
export const defaultOpenApiConfig: OpenApiConfig = {
  info: {
    title: 'Success Kid Community API',
    description: 'API documentation for the Success Kid Community Platform - A vibrant ecosystem where token value is supported by genuine utility, ongoing engagement, and community ownership.',
    version: getAppVersion(),
    contact: {
      name: 'API Support',
      url: 'https://github.com/success-kid/api/issues',
      email: 'api@successkid.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server'
    },
    {
      url: 'https://api-staging.successkid.com',
      description: 'Staging server'
    },
    {
      url: 'https://api.successkid.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'Authentication-related endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Points', description: 'Success Points system endpoints' },
    { name: 'Content', description: 'Content management endpoints' },
    { name: 'Market', description: 'Market data and analysis endpoints' },
    { name: 'Wallet', description: 'Wallet integration endpoints' },
    { name: 'Achievements', description: 'User achievements endpoints' },
    { name: 'Notifications', description: 'User notifications endpoints' },
    { name: 'Health', description: 'System health and monitoring endpoints' }
  ]
};

/**
 * Setup OpenAPI documentation for a Fastify instance
 * 
 * @param app Fastify instance to setup documentation for
 * @param config OpenAPI configuration (optional, uses default if not provided)
 */
export async function setupApiDocumentation(
  app: FastifyInstance, 
  config: Partial<OpenApiConfig> = {}
): Promise<void> {
  // Merge provided config with defaults
  const apiConfig = {
    ...defaultOpenApiConfig,
    ...config,
    info: {
      ...defaultOpenApiConfig.info,
      ...config.info
    }
  };

  // Determine if documentation should be enabled
  const enableDocs = env.NODE_ENV !== 'production' || env.ENABLE_API_DOCS === 'true';
  
  // Register Swagger
  await app.register(swagger, {
    openapi: {
      info: apiConfig.info,
      servers: apiConfig.servers,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: await getApiSchemas()
      },
      tags: apiConfig.tags
    }
  });
  
  // Only register Swagger UI if enabled
  if (enableDocs) {
    await app.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        persistAuthorization: true,
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        filter: true,
        displayRequestDuration: true
      },
      transformStaticCSP: (header) => header,
      staticCSP: true
    });
    
    // Add redirect from /docs to /documentation for convenience
    app.get('/docs', (_, reply) => {
      reply.redirect('/documentation');
    });
    
    app.log.info('API documentation available at /documentation');
  } else {
    app.log.info('API documentation disabled in production mode');
  }
}

/**
 * Get all API schemas from the schemas directory
 * 
 * @returns Object containing all schema definitions
 */
async function getApiSchemas(): Promise<Record<string, any>> {
  // Import all schema definitions
  const { 
    errorSchemas, 
    userSchemas, 
    pointsSchemas, 
    contentSchemas, 
    marketSchemas, 
    walletSchemas,
    standardResponseSchemas
  } = await import('./schemas');
  
  // Combine all schemas
  return {
    // Standard responses
    ...standardResponseSchemas,
    
    // Error schemas
    ...errorSchemas,
    
    // Domain schemas
    ...userSchemas,
    ...pointsSchemas,
    ...contentSchemas,
    ...marketSchemas,
    ...walletSchemas
  };
}
