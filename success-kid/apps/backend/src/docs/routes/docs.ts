/**
 * Documentation Routes
 * 
 * This file contains routes related to API documentation access and management.
 */
import { FastifyInstance } from 'fastify';
import { env } from '../../config';

/**
 * Register documentation-related routes
 * 
 * @param fastify Fastify instance
 */
export default async function registerDocsRoutes(fastify: FastifyInstance): Promise<void> {
  // Check if docs are enabled in this environment
  const docsEnabled = env.NODE_ENV !== 'production' || env.ENABLE_API_DOCS === 'true';
  
  // Skip registration if docs are disabled
  if (!docsEnabled) {
    return;
  }

  // Route to get OpenAPI spec as JSON
  fastify.get(
    '/api/docs/openapi.json',
    {
      schema: {
        summary: 'Get the OpenAPI specification in JSON format',
        tags: ['Documentation'],
        response: {
          200: {
            description: 'OpenAPI specification in JSON format',
            type: 'object',
            additionalProperties: true
          }
        }
      }
    },
    async (request, reply) => {
      return reply.send(fastify.swagger());
    }
  );

  // Route to get OpenAPI spec as YAML
  fastify.get(
    '/api/docs/openapi.yaml',
    {
      schema: {
        summary: 'Get the OpenAPI specification in YAML format',
        tags: ['Documentation'],
        response: {
          200: {
            description: 'OpenAPI specification in YAML format',
            type: 'string'
          }
        }
      }
    },
    async (request, reply) => {
      return reply
        .header('Content-Type', 'text/yaml')
        .send(fastify.swagger({ yaml: true }));
    }
  );

  // Route to display API documentation status
  fastify.get(
    '/api/docs/status',
    {
      schema: {
        summary: 'Get API documentation status information',
        tags: ['Documentation'],
        response: {
          200: {
            description: 'Documentation status information',
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether API documentation is enabled'
              },
              urls: {
                type: 'object',
                properties: {
                  ui: {
                    type: 'string',
                    description: 'URL to the Swagger UI documentation'
                  },
                  json: {
                    type: 'string',
                    description: 'URL to the OpenAPI JSON specification'
                  },
                  yaml: {
                    type: 'string',
                    description: 'URL to the OpenAPI YAML specification'
                  }
                }
              },
              version: {
                type: 'string',
                description: 'API specification version'
              },
              endpoints: {
                type: 'integer',
                description: 'Number of documented endpoints'
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // Get Swagger specification
      const spec = fastify.swagger();
      
      // Count endpoints
      let endpointCount = 0;
      if (spec.paths) {
        for (const path of Object.values(spec.paths)) {
          endpointCount += Object.keys(path).length;
        }
      }
      
      return {
        enabled: true,
        urls: {
          ui: '/documentation',
          json: '/api/docs/openapi.json',
          yaml: '/api/docs/openapi.yaml'
        },
        version: spec.info?.version || 'unknown',
        endpoints: endpointCount
      };
    }
  );
}
