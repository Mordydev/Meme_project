/**
 * Points API Schemas
 * 
 * OpenAPI schema definitions for points-related endpoints
 */
export const pointsBalanceSchema = {
  description: 'Get user points balance',
  tags: ['Points'],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', description: 'User ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            balance: { type: 'number' },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  source: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

export const pointsHistorySchema = {
  description: 'Get user points history',
  tags: ['Points'],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', description: 'User ID' }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of results to return', default: 20 },
      offset: { type: 'number', description: 'Offset for pagination', default: 0 },
      source: { type: 'string', description: 'Filter by points source' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  source: { type: 'string' },
                  reference_id: { type: 'string', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                  description: { type: 'string', nullable: true }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

export const awardPointsSchema = {
  description: 'Award points to a user',
  tags: ['Points'],
  body: {
    type: 'object',
    required: ['userId', 'amount', 'source'],
    properties: {
      userId: { type: 'string', description: 'User ID' },
      amount: { type: 'number', description: 'Points amount', minimum: 1 },
      source: { 
        type: 'string', 
        description: 'Points source',
        enum: [
          'content_creation',
          'comment',
          'upvote_received',
          'daily_login',
          'achievement',
          'referral',
          'profile_completion',
          'wallet_connection',
          'streak_bonus',
          'transfer_in',
          'transfer_out',
          'redemption',
          'special_event',
          'admin_adjustment'
        ]
      },
      referenceId: { type: 'string', description: 'Reference ID for the transaction', nullable: true },
      description: { type: 'string', description: 'Description of the transaction', nullable: true },
      skipVerification: { type: 'boolean', description: 'Skip verification checks (admin only)' },
      skipCaps: { type: 'boolean', description: 'Skip daily caps (admin only)' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            userId: { type: 'string' },
            amount: { type: 'number' },
            source: { type: 'string' },
            balance: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' }
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
              details: {
                type: 'object',
                nullable: true,
                properties: {
                  remainingCap: { type: 'number' }
                }
              }
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

export const dailyCapsSchema = {
  description: 'Get daily caps status for a user',
  tags: ['Points'],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', description: 'User ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            caps: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  used: { type: 'number' },
                  limit: { type: 'number' },
                  remaining: { type: 'number' }
                }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

export const redemptionEligibilitySchema = {
  description: 'Get redemption eligibility for a user',
  tags: ['Points'],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', description: 'User ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            isEligible: { type: 'boolean' },
            requirements: {
              type: 'object',
              properties: {
                minimumBalance: { type: 'number' },
                walletConnected: { type: 'boolean' },
                verificationComplete: { type: 'boolean' }
              }
            },
            limits: {
              type: 'object',
              properties: {
                conversionRate: { type: 'number' },
                minimumAmount: { type: 'number' },
                weeklyLimit: { type: 'number' },
                weeklyUsed: { type: 'number' },
                remaining: { type: 'number' },
                resetsAt: { type: 'string', format: 'date-time' }
              }
            },
            balance: {
              type: 'object',
              properties: {
                current: { type: 'number' },
                pending: { type: 'number' }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

export const redeemPointsSchema = {
  description: 'Redeem points for tokens',
  tags: ['Points'],
  body: {
    type: 'object',
    required: ['userId', 'amount'],
    properties: {
      userId: { type: 'string', description: 'User ID' },
      amount: { type: 'number', description: 'Points amount to redeem', minimum: 1000 },
      walletAddress: { type: 'string', description: 'Wallet address for token transfer', nullable: true }
    }
  },
  response: {
    202: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            redemptionId: { type: 'string' },
            userId: { type: 'string' },
            pointsAmount: { type: 'number' },
            tokenAmount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'flagged'] },
            estimatedCompletionTime: { type: 'string' }
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
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
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

export const leaderboardSchema = {
  description: 'Get points leaderboard',
  tags: ['Points'],
  querystring: {
    type: 'object',
    properties: {
      timeframe: { 
        type: 'string', 
        enum: ['day', 'week', 'month', 'all'],
        default: 'all'
      },
      limit: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 100,
        default: 10
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            leaderboard: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user_id: { type: 'string' },
                  display_name: { type: 'string' },
                  avatar_url: { type: 'string', nullable: true },
                  level: { type: 'number' },
                  points_total: { type: 'number' },
                  transactions_count: { type: 'number' }
                }
              }
            },
            timeframe: { type: 'string' }
          }
        }
      }
    }
  }
};

// Admin schemas for redemption management
export const flaggedRedemptionsSchema = {
  description: 'Get flagged redemptions for review',
  tags: ['Points Admin'],
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of results to return', default: 20 },
      offset: { type: 'number', description: 'Offset for pagination', default: 0 },
      startDate: { type: 'string', format: 'date-time', description: 'Filter by start date' },
      endDate: { type: 'string', format: 'date-time', description: 'Filter by end date' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              pointsAmount: { type: 'number' },
              tokenAmount: { type: 'number' },
              walletAddress: { type: 'string' },
              status: { type: 'string', enum: ['flagged'] },
              requestedAt: { type: 'string', format: 'date-time' },
              metadata: { 
                type: 'object',
                nullable: true,
                additionalProperties: true
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            hasMore: { type: 'boolean' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

export const reviewRedemptionSchema = {
  description: 'Review a flagged redemption',
  tags: ['Points Admin'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Redemption ID' }
    }
  },
  body: {
    type: 'object',
    required: ['action', 'reason'],
    properties: {
      action: { 
        type: 'string', 
        enum: ['approve', 'reject'],
        description: 'Action to take on the redemption'
      },
      reason: { 
        type: 'string', 
        minLength: 5,
        description: 'Reason for the decision'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            redemptionId: { type: 'string' },
            action: { type: 'string', enum: ['approve', 'reject'] },
            status: { type: 'string', enum: ['pending', 'failed'] },
            updatedAt: { type: 'string', format: 'date-time' }
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
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
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
    },
    404: {
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
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

export const redemptionStatsSchema = {
  description: 'Get redemption statistics',
  tags: ['Points Admin'],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time', description: 'Filter by start date' },
      endDate: { type: 'string', format: 'date-time', description: 'Filter by end date' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            totalRedemptions: { type: 'number' },
            totalPointsRedeemed: { type: 'number' },
            totalTokensDistributed: { type: 'number' },
            successRate: { type: 'number' },
            averageProcessingTime: { type: 'number' }, // in milliseconds
            statusBreakdown: {
              type: 'object',
              properties: {
                pending: { type: 'number' },
                processing: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
                flagged: { type: 'number' }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            timeframe: {
              type: 'object',
              properties: {
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

export const redemptionByIdSchema = {
  description: 'Get detailed redemption information',
  tags: ['Points Admin'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Redemption ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            redemption: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                pointsAmount: { type: 'number' },
                tokenAmount: { type: 'number' },
                walletAddress: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'flagged'] },
                requestedAt: { type: 'string', format: 'date-time' },
                processedAt: { type: 'string', format: 'date-time', nullable: true },
                transactionHash: { type: 'string', nullable: true },
                failureReason: { type: 'string', nullable: true },
                metadata: { 
                  type: 'object',
                  nullable: true,
                  additionalProperties: true
                }
              }
            },
            transaction: {
              type: 'object',
              nullable: true,
              properties: {
                txHash: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
                fromAddress: { type: 'string' },
                toAddress: { type: 'string' },
                amount: { type: 'number' },
                blockNumber: { type: 'number', nullable: true },
                confirmations: { type: 'number', nullable: true },
                gasUsed: { type: 'number', nullable: true },
                timestamp: { type: 'string', format: 'date-time', nullable: true }
              }
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
    },
    404: {
      type: 'object',
      properties: {
        data: { type: 'null' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
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
