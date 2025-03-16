/**
 * Validation Middleware
 * 
 * Middleware for validating request data using Zod schemas
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../lib/logger';

export interface ValidationOptions {
  source: 'body' | 'params' | 'query' | 'headers';
}

/**
 * Create validation middleware using a Zod schema
 * 
 * @param schema Zod schema for validation
 * @param options Options for validation
 * @returns Fastify middleware function
 */
export function validate<T>(
  schema: ZodSchema<T>,
  options: ValidationOptions = { source: 'body' }
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get data from the appropriate request source
      const data = options.source === 'body' ? request.body : 
                  options.source === 'params' ? request.params : 
                  options.source === 'query' ? request.query :
                  request.headers;
                  
      // Validate data against schema
      const validatedData = await schema.parseAsync(data);
      
      // Replace request data with validated data
      if (options.source === 'body') {
        request.body = validatedData;
      } else if (options.source === 'params') {
        request.params = validatedData;
      } else if (options.source === 'query') {
        request.query = validatedData;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error('Validation error', {
          error: error.errors,
          source: options.source,
          path: request.url
        });
        
        // Format validation errors for client response
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        // Return validation error response
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          validation: formattedErrors
        });
      }
      
      // Handle unexpected validation errors
      logger.error('Unexpected validation error', { error, path: request.url });
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  };
}
