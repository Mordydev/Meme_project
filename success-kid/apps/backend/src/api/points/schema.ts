/**
 * Points API Schema Definitions
 * 
 * Validation schemas for points-related API endpoints
 */

// Award points schema
export const awardPointsSchema = {
  body: {
    type: 'object',
    required: ['userId', 'amount', 'source'],
    properties: {
      userId: { type: 'string' },
      amount: { type: 'number', minimum: 1 },
      source: { 
        type: 'string',
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
          'special_event'
        ]
      },
      referenceId: { type: 'string' },
      description: { type: 'string' },
      skipVerification: { type: 'boolean' },
      skipCaps: { type: 'boolean' }
    }
  }
};

// Admin award points schema
export const adminAwardPointsSchema = {
  body: {
    type: 'object',
    required: ['userId', 'amount', 'source', 'description'],
    properties: {
      userId: { type: 'string' },
      amount: { type: 'number', minimum: 1 },
      source: { 
        type: 'string',
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
      description: { type: 'string', minLength: 5 },
      referenceId: { type: 'string' }
    }
  }
};

// Admin deduct points schema
export const adminDeductPointsSchema = {
  body: {
    type: 'object',
    required: ['userId', 'amount', 'description'],
    properties: {
      userId: { type: 'string' },
      amount: { type: 'number', minimum: 1 },
      description: { type: 'string', minLength: 5 },
      referenceId: { type: 'string' }
    }
  }
};

// Redemption request schema
export const redemptionRequestSchema = {
  body: {
    type: 'object',
    required: ['userId', 'amount'],
    properties: {
      userId: { type: 'string' },
      amount: { type: 'number', minimum: 1000 }, // Minimum 1,000 points (10 tokens)
      walletAddress: { type: 'string' },
      metadata: { type: 'object' }
    }
  }
};

// Review redemption schema
export const reviewRedemptionSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['action', 'reason'],
    properties: {
      action: { type: 'string', enum: ['approve', 'reject'] },
      reason: { type: 'string', minLength: 5 }
    }
  }
};

// Toggle special event schema
export const toggleSpecialEventSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['active'],
    properties: {
      active: { type: 'boolean' }
    }
  }
};

// Simulate activity schema
export const simulateActivitySchema = {
  body: {
    type: 'object',
    required: ['userId', 'activity'],
    properties: {
      userId: { type: 'string' },
      activity: { 
        type: 'string',
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
          'special_event'
        ]
      },
      count: { type: 'number', minimum: 1, maximum: 100, default: 1 }
    }
  }
};
