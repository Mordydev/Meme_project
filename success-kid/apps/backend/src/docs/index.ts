/**
 * Documentation Module
 * 
 * Central module for API documentation through OpenAPI specification
 */
import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import { getOpenApiConfig, getSwaggerUiOptions } from './openapi';
import * as schemas from './schemas';
import { registerRouteSchemas } from './routes';

/**
 * Documentation plugin
 * Configures and registers Swagger documentation
 */
export const docsPlugin = fp(async function (fastify: FastifyInstance) {
  const openApiConfig = getOpenApiConfig();
  const swaggerUiOptions = getSwaggerUiOptions();
  
  // Register Swagger
  await fastify.register(swagger, {
    openapi: openApiConfig
  });
  
  // Register Swagger UI
  await fastify.register(swaggerUi, swaggerUiOptions);
  
  // Register schemas for validation and documentation
  Object.entries(schemas).forEach(([name, schema]) => {
    fastify.addSchema(schema);
  });
  
  // Register route schemas
  registerRouteSchemas(fastify);
  
  // Add a hook to verify documentation is complete
  fastify.addHook('onReady', async () => {
    const swagger = fastify.swagger();
    const pathCount = Object.keys(swagger.paths || {}).length;
    const schemaCount = Object.keys(swagger.components?.schemas || {}).length;
    
    fastify.log.info(
      `API Documentation ready with ${pathCount} paths and ${schemaCount} schemas`
    );
  });
});

export { getOpenApiConfig } from './openapi';
export * from './schemas';
export * from './routes';
