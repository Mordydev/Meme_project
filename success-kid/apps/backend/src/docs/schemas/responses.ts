/**
 * Standard API Response Schemas
 * 
 * Defines common response format schemas for OpenAPI documentation.
 */

/**
 * Standard response schema components for OpenAPI
 */
const standardResponseSchemas = {
  SuccessResponse: {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'object',
        description: 'Response payload',
        additionalProperties: true
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          },
          requestId: {
            type: 'string',
            description: 'Unique request identifier'
          }
        }
      },
      pagination: {
        type: 'object',
        description: 'Pagination information if applicable',
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number'
          },
          pageSize: {
            type: 'integer',
            description: 'Number of items per page'
          },
          totalItems: {
            type: 'integer',
            description: 'Total number of items'
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages'
          }
        }
      }
    }
  },
  
  // Common paginated response
  PaginatedResponse: {
    type: 'object',
    required: ['data', 'meta', 'pagination'],
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true
        },
        description: 'Array of response items'
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          },
          requestId: {
            type: 'string',
            description: 'Unique request identifier'
          }
        }
      },
      pagination: {
        type: 'object',
        required: ['page', 'pageSize', 'totalItems', 'totalPages'],
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number'
          },
          pageSize: {
            type: 'integer',
            description: 'Number of items per page'
          },
          totalItems: {
            type: 'integer',
            description: 'Total number of items'
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages'
          },
          hasNextPage: {
            type: 'boolean',
            description: 'Whether there is a next page'
          },
          hasPreviousPage: {
            type: 'boolean',
            description: 'Whether there is a previous page'
          }
        }
      }
    }
  },
  
  // Boolean success response
  BooleanResponse: {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'object',
        required: ['success'],
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the operation was successful'
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          },
          requestId: {
            type: 'string',
            description: 'Unique request identifier'
          }
        }
      }
    }
  },
  
  // Empty success response
  EmptyResponse: {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'null',
        description: 'No data returned'
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          },
          requestId: {
            type: 'string',
            description: 'Unique request identifier'
          }
        }
      }
    }
  }
};

export default standardResponseSchemas;
