/**
 * Request validation middleware
 * 
 * This middleware validates request data against schemas to ensure data integrity.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import Ajv, { Schema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { logger } from '../../lib/logger';
import { ValidationError } from '../../errors';

// Create and configure Ajv instance
const ajv = new Ajv({
  allErrors: true,           // Return all errors, not just the first one
  removeAdditional: true,    // Remove additional properties not in the schema
  useDefaults: true,         // Set default values from the schema
  coerceTypes: true,         // Coerce data types according to schema
  strictTypes: false,        // Allow type coercion
  strictRequired: true       // Require all required properties
});

// Add formats for validation
addFormats(ajv);

// Cache for compiled validation functions
const validatorCache = new Map<string, ValidateFunction>();

/**
 * Create a validator function for a schema
 */
function createValidator(schema: Schema): ValidateFunction {
  const cacheKey = JSON.stringify(schema);
  
  if (validatorCache.has(cacheKey)) {
    return validatorCache.get(cacheKey)!;
  }
  
  const validator = ajv.compile(schema);
  validatorCache.set(cacheKey, validator);
  
  return validator;
}

/**
 * Validate data against a schema
 */
export function validateAgainstSchema(data: any, schema: Schema): { valid: boolean; errors?: any[] } {
  const validate = createValidator(schema);
  const valid = validate(data);
  
  if (!valid) {
    return {
      valid: false,
      errors: validate.errors
    };
  }
  
  return { valid: true };
}

/**
 * Format validation errors for response
 */
function formatValidationErrors(errors: any[]): any[] {
  return errors.map(error => {
    const path = error.instancePath ? error.instancePath.substring(1).replace(/\//g, '.') : '';
    
    return {
      path: path || error.params.missingProperty || '',
      message: error.message,
      keyword: error.keyword,
      params: error.params
    };
  });
}

/**
 * Create a middleware that validates request data against a schema
 */
export function createValidationMiddleware(options: {
  body?: Schema;
  params?: Schema;
  query?: Schema;
  response?: Record<number, Schema>;
}) {
  return async function validationMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate request params
      if (options.params && Object.keys(request.params || {}).length > 0) {
        const result = validateAgainstSchema(request.params, options.params);
        
        if (!result.valid) {
          throw new ValidationError('Invalid route parameters', {
            errors: formatValidationErrors(result.errors!)
          });
        }
      }
      
      // Validate request query
      if (options.query && Object.keys(request.query || {}).length > 0) {
        const result = validateAgainstSchema(request.query, options.query);
        
        if (!result.valid) {
          throw new ValidationError('Invalid query parameters', {
            errors: formatValidationErrors(result.errors!)
          });
        }
      }
      
      // Validate request body
      if (options.body && request.body) {
        const result = validateAgainstSchema(request.body, options.body);
        
        if (!result.valid) {
          throw new ValidationError('Invalid request body', {
            errors: formatValidationErrors(result.errors!)
          });
        }
      }
      
      // Store response validators for later use in response validation hook
      if (options.response) {
        const responseValidators: Record<string, ValidateFunction> = {};
        
        for (const [status, schema] of Object.entries(options.response)) {
          responseValidators[status] = createValidator(schema);
        }
        
        // Store validators on the request for use in response hook
        (request as any).responseValidators = responseValidators;
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error in validation middleware', { error });
      throw new ValidationError('Request validation failed');
    }
  };
}

/**
 * Response validation hook
 * 
 * This hook validates response data against schemas if defined
 */
export function responseValidationHook(request: FastifyRequest, reply: FastifyReply, payload: string | Buffer): string | Buffer {
  // Skip if no response validators
  if (!(request as any).responseValidators) {
    return payload;
  }
  
  try {
    const responseValidators = (request as any).responseValidators;
    const statusCode = reply.statusCode.toString();
    
    // Skip if no validator for this status code
    if (!responseValidators[statusCode]) {
      return payload;
    }
    
    // Parse payload if it's a string
    let data;
    
    if (typeof payload === 'string') {
      try {
        data = JSON.parse(payload);
      } catch (error) {
        logger.warn('Could not parse response payload for validation', { error });
        return payload;
      }
    } else if (Buffer.isBuffer(payload)) {
      try {
        data = JSON.parse(payload.toString());
      } catch (error) {
        logger.warn('Could not parse response payload for validation', { error });
        return payload;
      }
    } else {
      data = payload;
    }
    
    // Validate response data
    const validator = responseValidators[statusCode];
    const valid = validator(data);
    
    if (!valid) {
      logger.error('Response validation failed', {
        statusCode,
        errors: validator.errors,
        url: request.url
      });
      
      // In development, throw an error for response validation failures
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Response validation failed: ${JSON.stringify(validator.errors)}`);
      }
    }
  } catch (error) {
    logger.error('Error in response validation hook', { error });
  }
  
  return payload;
}
