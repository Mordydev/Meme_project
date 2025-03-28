/**
 * Validation Middleware
 * 
 * Provides middleware for validating request data against Zod schemas
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors';
import { logger } from '../lib/logger';

/**
 * Source of data to validate in the request
 */
export type ValidationSource = 'body' | 'params' | 'query' | 'headers';

/**
 * Options for validation middleware
 */
export interface ValidationOptions {
  /**
   * Whether to strip additional properties not defined in the schema
   * @default true
   */
  stripUnknown?: boolean;
  
  /**
   * Custom error messages
   */
  errorMessages?: Record<string, string>;
}

/**
 * Middleware to validate request data against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @param source Source of data to validate (body, params, query, headers)
 * @param options Validation options
 * @returns Middleware function that validates request data
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  source: ValidationSource = 'body',
  options: ValidationOptions = { stripUnknown: true }
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get data from request based on source
      const data = source === 'body' ? request.body : 
                   source === 'params' ? request.params : 
                   source === 'query' ? request.query :
                   request.headers;
                   
      // Parse data with Zod schema
      const validated = await schema.parseAsync(data);
      
      // Replace request data with validated data
      if (source === 'body') {
        request.body = validated;
      } else if (source === 'params') {
        request.params = validated;
      } else if (source === 'query') {
        request.query = validated;
      } else {
        // For headers, we don't replace the entire headers object
        // as it contains important Fastify-managed headers
        Object.keys(validated).forEach(key => {
          request.headers[key] = validated[key];
        });
      }
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        logger.debug('Validation error', { 
          path: request.url, 
          method: request.method,
          source,
          errors: error.errors 
        });
        
        // Transform Zod errors into our application's validation error format
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: options?.errorMessages?.[err.path.join('.')] || err.message
        }));
        
        throw new ValidationError(
          'Validation failed',
          validationErrors
        );
      }
      
      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
  return validateRequest(schema, 'body', options);
}

/**
 * Middleware to validate request params against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
  return validateRequest(schema, 'params', options);
}

/**
 * Middleware to validate request query against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
  return validateRequest(schema, 'query', options);
}
