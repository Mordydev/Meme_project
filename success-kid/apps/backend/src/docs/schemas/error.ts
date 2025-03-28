/**
 * Error Schema Definitions
 * 
 * Defines standard error response schemas for OpenAPI documentation.
 */

/**
 * Standard error schema for OpenAPI
 */
const errorSchemas = {
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
          required: ['code', 'message'],
          properties: {
            code: {
              type: 'string',
              description: 'Error code identifier'
            },
            message: {
              type: 'string',
              description: 'Human-readable error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
              description: 'Additional error details if applicable'
            },
          },
        },
      },
    },
  },
  
  ValidationError: {
    allOf: [
      { $ref: '#/components/schemas/Error' },
      {
        type: 'object',
        example: {
          data: null,
          meta: {
            timestamp: '2023-03-15T12:00:00Z',
            requestId: 'req_1234567890'
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'The provided data is invalid',
              details: [
                {
                  field: 'email',
                  message: 'Email must be a valid email address'
                }
              ]
            }
          ]
        }
      }
    ]
  },
  
  NotFoundError: {
    allOf: [
      { $ref: '#/components/schemas/Error' },
      {
        type: 'object',
        example: {
          data: null,
          meta: {
            timestamp: '2023-03-15T12:00:00Z',
            requestId: 'req_1234567890'
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'The requested resource was not found'
            }
          ]
        }
      }
    ]
  },
  
  UnauthorizedError: {
    allOf: [
      { $ref: '#/components/schemas/Error' },
      {
        type: 'object',
        example: {
          data: null,
          meta: {
            timestamp: '2023-03-15T12:00:00Z',
            requestId: 'req_1234567890'
          },
          errors: [
            {
              code: 'UNAUTHORIZED',
              message: 'Authentication is required to access this resource'
            }
          ]
        }
      }
    ]
  },
  
  ForbiddenError: {
    allOf: [
      { $ref: '#/components/schemas/Error' },
      {
        type: 'object',
        example: {
          data: null,
          meta: {
            timestamp: '2023-03-15T12:00:00Z',
            requestId: 'req_1234567890'
          },
          errors: [
            {
              code: 'FORBIDDEN',
              message: 'You do not have permission to access this resource'
            }
          ]
        }
      }
    ]
  },
  
  InternalServerError: {
    allOf: [
      { $ref: '#/components/schemas/Error' },
      {
        type: 'object',
        example: {
          data: null,
          meta: {
            timestamp: '2023-03-15T12:00:00Z',
            requestId: 'req_1234567890'
          },
          errors: [
            {
              code: 'SERVER_ERROR',
              message: 'An unexpected error occurred'
            }
          ]
        }
      }
    ]
  },
  
  TooManyRequestsError: {
    allOf: [
      { $ref: '#/components/schemas/Error' },
      {
        type: 'object',
        example: {
          data: null,
          meta: {
            timestamp: '2023-03-15T12:00:00Z',
            requestId: 'req_1234567890'
          },
          errors: [
            {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later'
            }
          ]
        }
      }
    ]
  }
};

export default errorSchemas;
