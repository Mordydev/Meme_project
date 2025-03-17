/**
 * Wallet route schemas for API documentation
 */
import { FastifyInstance } from 'fastify';

/**
 * Register wallet route schemas
 */
export function walletRoutes(fastify: FastifyInstance): void {
  // Connect wallet request for POST /wallet/connect
  fastify.addSchema({
    $id: 'connectWalletRequest',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          wallet_address: {
            type: 'string',
            description: 'Wallet address to connect',
          },
        },
        required: ['wallet_address'],
      },
    },
    required: ['data'],
  });
  
  // Connect wallet response for POST /wallet/connect
  fastify.addSchema({
    $id: 'connectWalletResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the wallet was connected successfully',
          },
          connection_id: {
            type: 'string',
            description: 'Connection ID',
          },
          wallet_address: {
            type: 'string',
            description: 'Connected wallet address',
          },
          verification_message: {
            type: 'string',
            description: 'Message to sign for verification',
          },
        },
        required: ['success', 'connection_id', 'wallet_address', 'verification_message'],
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
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
  
  // Verify wallet request for POST /wallet/verify
  fastify.addSchema({
    $id: 'verifyWalletRequest',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          connection_id: {
            type: 'string',
            description: 'Connection ID',
          },
          signature: {
            type: 'string',
            description: 'Signature of the verification message',
          },
        },
        required: ['connection_id', 'signature'],
      },
    },
    required: ['data'],
  });
  
  // Verify wallet response for POST /wallet/verify
  fastify.addSchema({
    $id: 'verifyWalletResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the wallet was verified successfully',
          },
          wallet_address: {
            type: 'string',
            description: 'Verified wallet address',
          },
          is_verified: {
            type: 'boolean',
            description: 'Verification status',
          },
        },
        required: ['success', 'wallet_address', 'is_verified'],
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
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
  
  // Get connected wallets response for GET /wallet/connections
  fastify.addSchema({
    $id: 'walletConnectionsResponse',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Connection ID',
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
            token_balance: {
              type: 'number',
              description: 'Token balance (if available)',
            },
          },
          required: ['id', 'wallet_address', 'is_verified', 'connected_at'],
        },
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
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
  
  // Disconnect wallet request for DELETE /wallet/disconnect
  fastify.addSchema({
    $id: 'disconnectWalletRequest',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          connection_id: {
            type: 'string',
            description: 'Connection ID',
          },
        },
        required: ['connection_id'],
      },
    },
    required: ['data'],
  });
  
  // Disconnect wallet response for DELETE /wallet/disconnect
  fastify.addSchema({
    $id: 'disconnectWalletResponse',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the wallet was disconnected successfully',
          },
        },
        required: ['success'],
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
        required: ['timestamp'],
      },
    },
    required: ['data', 'meta'],
  });
}
