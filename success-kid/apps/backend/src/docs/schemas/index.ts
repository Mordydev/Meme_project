/**
 * Schema definitions for OpenAPI documentation
 */
import { JSONSchema7 } from 'json-schema';

/**
 * Standard success response wrapper
 */
export const SuccessResponse: JSONSchema7 = {
  type: 'object',
  title: 'SuccessResponse',
  properties: {
    data: {
      type: ['object', 'array'],
      description: 'Response payload',
    },
    meta: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Response timestamp',
        },
        requestId: {
          type: 'string',
          description: 'Unique request identifier',
        },
      },
    },
    pagination: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Current page number',
        },
        pageSize: {
          type: 'integer',
          description: 'Number of items per page',
        },
        totalItems: {
          type: 'integer',
          description: 'Total number of items',
        },
        totalPages: {
          type: 'integer',
          description: 'Total number of pages',
        },
      },
    },
  },
  required: ['data', 'meta'],
};

/**
 * Standard error response
 */
export const Error: JSONSchema7 = {
  type: 'object',
  title: 'Error',
  properties: {
    data: {
      type: 'null',
      description: 'No data on error responses',
    },
    meta: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Error timestamp',
        },
        requestId: {
          type: 'string',
          description: 'Unique request identifier',
        },
      },
    },
    errors: {
      type: 'array',
      description: 'List of errors',
      items: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Error code',
          },
          message: {
            type: 'string',
            description: 'Human-readable error message',
          },
          details: {
            type: 'array',
            description: 'Additional error details',
            items: {
              type: 'object',
            },
          },
        },
        required: ['code', 'message'],
      },
    },
  },
  required: ['data', 'meta', 'errors'],
};

/**
 * User schema
 */
export const User: JSONSchema7 = {
  type: 'object',
  title: 'User',
  properties: {
    id: {
      type: 'string',
      description: 'Unique user identifier',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
    },
    display_name: {
      type: 'string',
      description: 'User display name',
    },
    profile_image: {
      type: 'string',
      format: 'uri',
      description: 'URL to user profile image',
    },
    level: {
      type: 'integer',
      description: 'User level',
    },
    title: {
      type: 'string',
      description: 'User title',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'User creation timestamp',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'User last update timestamp',
    },
  },
  required: ['id', 'display_name', 'created_at'],
};

/**
 * Points schema
 */
export const Points: JSONSchema7 = {
  type: 'object',
  title: 'Points',
  properties: {
    balance: {
      type: 'integer',
      description: 'Current points balance',
    },
    transactions: {
      type: 'array',
      description: 'Recent points transactions',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Transaction identifier',
          },
          amount: {
            type: 'integer',
            description: 'Transaction amount',
          },
          source: {
            type: 'string',
            description: 'Source of the transaction',
          },
          reference_id: {
            type: 'string',
            description: 'Reference identifier (if applicable)',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction timestamp',
          },
          description: {
            type: 'string',
            description: 'Transaction description',
          },
        },
        required: ['id', 'amount', 'source', 'created_at'],
      },
    },
  },
  required: ['balance'],
};

/**
 * Content schema
 */
export const Content: JSONSchema7 = {
  type: 'object',
  title: 'Content',
  properties: {
    id: {
      type: 'string',
      description: 'Content identifier',
    },
    user_id: {
      type: 'string',
      description: 'Creator user identifier',
    },
    type: {
      type: 'string',
      enum: ['text', 'image', 'link', 'poll'],
      description: 'Content type',
    },
    title: {
      type: 'string',
      description: 'Content title',
    },
    content: {
      type: 'string',
      description: 'Main content text',
    },
    media_urls: {
      type: 'array',
      description: 'Media URLs (if applicable)',
      items: {
        type: 'string',
        format: 'uri',
      },
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'Content creation timestamp',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'Content update timestamp',
    },
    status: {
      type: 'string',
      enum: ['active', 'deleted', 'flagged'],
      description: 'Content status',
    },
  },
  required: ['id', 'user_id', 'type', 'created_at', 'status'],
};

/**
 * Wallet Connection schema
 */
export const WalletConnection: JSONSchema7 = {
  type: 'object',
  title: 'WalletConnection',
  properties: {
    id: {
      type: 'string',
      description: 'Connection identifier',
    },
    user_id: {
      type: 'string',
      description: 'User identifier',
    },
    wallet_address: {
      type: 'string',
      description: 'Wallet address',
    },
    is_verified: {
      type: 'boolean',
      description: 'Verification status',
    },
    connected_at: {
      type: 'string',
      format: 'date-time',
      description: 'Connection timestamp',
    },
    last_verified_at: {
      type: 'string',
      format: 'date-time',
      description: 'Last verification timestamp',
    },
  },
  required: ['id', 'user_id', 'wallet_address', 'is_verified', 'connected_at'],
};

/**
 * Health Check Response schema
 */
export const HealthCheck: JSONSchema7 = {
  type: 'object',
  title: 'HealthCheck',
  properties: {
    status: {
      type: 'string',
      enum: ['healthy', 'unhealthy', 'degraded'],
      description: 'Overall system health status',
    },
    checks: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Individual check status',
          },
          error: {
            type: 'string',
            description: 'Error message if check failed',
          },
          details: {
            type: 'object',
            description: 'Additional check details',
            additionalProperties: true,
          },
        },
        required: ['status'],
      },
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Check timestamp',
    },
    version: {
      type: 'string',
      description: 'API version',
    },
    uptime: {
      type: 'number',
      description: 'Server uptime in seconds',
    },
  },
  required: ['status', 'checks', 'timestamp'],
};
