/**
 * Wallet Connection API Schemas
 * 
 * Validation schemas for wallet connection endpoints
 */
import { FastifySchema } from 'fastify';

/**
 * Schema for initializing wallet connection
 */
export const initializeWalletSchema: FastifySchema = {
  description: 'Initialize a wallet connection session and generate a message to sign',
  tags: ['Wallet'],
  summary: 'Initialize wallet connection',
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['walletType'],
        properties: {
          walletType: { 
            type: 'string',
            description: 'Type of wallet to connect (phantom, solflare, slope)',
            enum: ['phantom', 'solflare', 'slope']
          }
        }
      }
    }
  },
  response: {
    200: {
      description: 'Successful response with verification message',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            message: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    },
    400: {
      description: 'Bad request',
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    }
  }
};

/**
 * Schema for verifying wallet signature
 */
export const verifyWalletSchema: FastifySchema = {
  description: 'Verify a wallet signature to confirm ownership',
  tags: ['Wallet'],
  summary: 'Verify wallet ownership',
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['sessionId', 'address', 'signature'],
        properties: {
          sessionId: { 
            type: 'string',
            description: 'Session ID from initialization step'
          },
          address: { 
            type: 'string',
            description: 'Wallet address',
            minLength: 30,
            maxLength: 255
          },
          signature: { 
            type: 'string',
            description: 'Signature from the wallet',
            minLength: 10
          }
        }
      }
    }
  },
  response: {
    200: {
      description: 'Successful verification',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            verified: { type: 'boolean' },
            address: { type: 'string' },
            isPrimary: { type: 'boolean' },
            connectedAt: { type: 'string', format: 'date-time' },
            lastVerifiedAt: { type: 'string', format: 'date-time' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    },
    400: {
      description: 'Verification failed',
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    }
  }
};

/**
 * Schema for getting user wallet connections
 */
export const getUserWalletsSchema: FastifySchema = {
  description: 'Get all wallet connections for the authenticated user',
  tags: ['Wallet'],
  summary: 'Get user wallet connections',
  response: {
    200: {
      description: 'Successful response with wallet connections',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              address: { type: 'string' },
              isVerified: { type: 'boolean' },
              isPrimary: { type: 'boolean' },
              connectedAt: { type: 'string', format: 'date-time' },
              lastVerifiedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    }
  }
};

/**
 * Schema for disconnecting a wallet
 */
export const disconnectWalletSchema: FastifySchema = {
  description: 'Disconnect a wallet from the user account',
  tags: ['Wallet'],
  summary: 'Disconnect wallet',
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { 
            type: 'string',
            description: 'Wallet address to disconnect',
            minLength: 30,
            maxLength: 255
          }
        }
      }
    }
  },
  response: {
    200: {
      description: 'Successful disconnection',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    },
    400: {
      description: 'Disconnection failed',
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    }
  }
};

/**
 * Schema for wallet connection history
 */
export const connectionHistorySchema: FastifySchema = {
  description: 'Get wallet connection history for the authenticated user',
  tags: ['Wallet'],
  summary: 'Get wallet connection history',
  querystring: {
    type: 'object',
    properties: {
      limit: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 100, 
        default: 20,
        description: 'Maximum number of events to return'
      }
    }
  },
  response: {
    200: {
      description: 'Successful response with connection history',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              walletAddress: { type: 'string' },
              eventType: { 
                type: 'string',
                enum: ['connection', 'verification', 'disconnection']
              },
              timestamp: { type: 'string', format: 'date-time' },
              metadata: { type: 'object' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    }
  }
};
