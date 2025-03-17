/**
 * Market Schema Definitions
 * 
 * Defines market data-related schemas for OpenAPI documentation.
 */

const marketSchemas = {
  MarketData: {
    type: 'object',
    required: ['price', 'marketCap', 'change24h', 'volume24h', 'timestamp'],
    properties: {
      price: {
        type: 'number',
        format: 'float',
        description: 'Current token price in USD'
      },
      marketCap: {
        type: 'number',
        format: 'float',
        description: 'Current market capitalization in USD'
      },
      change24h: {
        type: 'number',
        format: 'float',
        description: '24-hour price change percentage'
      },
      volume24h: {
        type: 'number',
        format: 'float',
        description: '24-hour trading volume in USD'
      },
      holders: {
        type: 'integer',
        description: 'Number of token holders'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp of the market data'
      }
    }
  },

  MilestoneStatus: {
    type: 'object',
    required: ['currentMarketCap', 'nextMilestone', 'progress', 'milestones'],
    properties: {
      currentMarketCap: {
        type: 'number',
        format: 'float',
        description: 'Current market capitalization in USD'
      },
      nextMilestone: {
        type: 'number',
        format: 'float',
        description: 'Value of the next milestone in USD'
      },
      progress: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        description: 'Percentage progress toward next milestone'
      },
      milestones: {
        type: 'array',
        items: {
          type: 'object',
          required: ['value', 'achieved'],
          properties: {
            value: {
              type: 'number',
              format: 'float',
              description: 'Milestone value in USD'
            },
            achieved: {
              type: 'boolean',
              description: 'Whether this milestone has been achieved'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When this milestone was achieved (if applicable)'
            }
          }
        },
        description: 'List of all market cap milestones'
      }
    }
  },

  Transaction: {
    type: 'object',
    required: ['hash', 'type', 'amount', 'timestamp'],
    properties: {
      hash: {
        type: 'string',
        description: 'Transaction hash'
      },
      type: {
        type: 'string',
        enum: ['buy', 'sell', 'transfer'],
        description: 'Transaction type'
      },
      fromAddress: {
        type: 'string',
        description: 'Source wallet address'
      },
      toAddress: {
        type: 'string',
        description: 'Destination wallet address'
      },
      amount: {
        type: 'number',
        format: 'float',
        description: 'Transaction amount in tokens'
      },
      amountUsd: {
        type: 'number',
        format: 'float',
        description: 'Transaction amount in USD'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Transaction timestamp'
      },
      blockNumber: {
        type: 'integer',
        description: 'Block number containing this transaction'
      },
      fee: {
        type: 'number',
        format: 'float',
        description: 'Transaction fee'
      }
    }
  },

  PriceHistory: {
    type: 'object',
    required: ['interval', 'data'],
    properties: {
      interval: {
        type: 'string',
        enum: ['1h', '1d', '1w', '1m', 'all'],
        description: 'Time interval for price data'
      },
      data: {
        type: 'array',
        items: {
          type: 'object',
          required: ['timestamp', 'price'],
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Data point timestamp'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Token price in USD'
            },
            volume: {
              type: 'number',
              format: 'float',
              description: 'Trading volume in USD'
            },
            marketCap: {
              type: 'number',
              format: 'float',
              description: 'Market capitalization in USD'
            }
          }
        },
        description: 'Historical price data points'
      }
    }
  },

  MarketOverview: {
    type: 'object',
    required: ['currentData', 'milestoneStatus'],
    properties: {
      currentData: {
        $ref: '#/components/schemas/MarketData'
      },
      milestoneStatus: {
        $ref: '#/components/schemas/MilestoneStatus'
      },
      recentTransactions: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Transaction'
        },
        description: 'Recent transactions'
      }
    }
  }
};

export default marketSchemas;
