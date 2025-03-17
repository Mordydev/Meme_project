/**
 * Wallet Schema Definitions
 * 
 * Defines wallet-related schemas for OpenAPI documentation.
 */

const walletSchemas = {
  WalletConnection: {
    type: 'object',
    required: ['id', 'userId', 'walletAddress', 'isVerified', 'connectedAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique connection identifier'
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID associated with this wallet'
      },
      walletAddress: {
        type: 'string',
        description: 'Public wallet address'
      },
      isVerified: {
        type: 'boolean',
        description: 'Whether the wallet has been verified'
      },
      connectedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the wallet was connected'
      },
      lastVerifiedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the wallet was last verified'
      }
    }
  },

  TokenBalance: {
    type: 'object',
    required: ['walletAddress', 'balance'],
    properties: {
      walletAddress: {
        type: 'string',
        description: 'Wallet address'
      },
      balance: {
        type: 'number',
        format: 'float',
        description: 'Token balance'
      },
      balanceUsd: {
        type: 'number',
        format: 'float',
        description: 'Token balance in USD'
      },
      lastUpdated: {
        type: 'string',
        format: 'date-time',
        description: 'Last balance update timestamp'
      }
    }
  },

  WalletConnectRequest: {
    type: 'object',
    required: ['walletAddress', 'signature', 'message'],
    properties: {
      walletAddress: {
        type: 'string',
        description: 'Public wallet address to connect'
      },
      signature: {
        type: 'string',
        description: 'Signature proving ownership of the wallet'
      },
      message: {
        type: 'string',
        description: 'Original message that was signed'
      }
    }
  },

  WalletVerificationRequest: {
    type: 'object',
    required: ['walletAddress', 'signature', 'message'],
    properties: {
      walletAddress: {
        type: 'string',
        description: 'Public wallet address to verify'
      },
      signature: {
        type: 'string',
        description: 'Signature proving ownership of the wallet'
      },
      message: {
        type: 'string',
        description: 'Original message that was signed'
      }
    }
  },

  WalletConnectResponse: {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'object',
        properties: {
          connected: {
            type: 'boolean',
            description: 'Whether the wallet was successfully connected'
          },
          walletAddress: {
            type: 'string',
            description: 'Connected wallet address'
          },
          isVerified: {
            type: 'boolean',
            description: 'Whether the wallet is verified'
          },
          tokenBalance: {
            type: 'number',
            format: 'float',
            description: 'Token balance (if available)'
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          requestId: {
            type: 'string'
          }
        }
      }
    }
  },

  WalletDisconnectResponse: {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'object',
        properties: {
          disconnected: {
            type: 'boolean',
            description: 'Whether the wallet was successfully disconnected'
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          requestId: {
            type: 'string'
          }
        }
      }
    }
  }
};

export default walletSchemas;
