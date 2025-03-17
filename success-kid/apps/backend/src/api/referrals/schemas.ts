/**
 * Referral API Schemas
 * 
 * Defines request and response schemas for referral routes
 */
import { Type } from '@sinclair/typebox';

/**
 * Create custom referral code request
 */
export const createCustomCodeSchema = {
  body: Type.Object({
    customCode: Type.String({ minLength: 4, maxLength: 20 })
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        code: Type.String(),
        url: Type.String({ format: 'uri' })
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    }),
    400: Type.Object({
      data: Type.Null(),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      }),
      errors: Type.Array(
        Type.Object({
          code: Type.String(),
          message: Type.String(),
          details: Type.Optional(Type.Any())
        })
      )
    })
  }
};

/**
 * Get referral code response
 */
export const getReferralCodeSchema = {
  response: {
    200: Type.Object({
      data: Type.Object({
        code: Type.String(),
        url: Type.String({ format: 'uri' }),
        isNew: Type.Boolean()
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Validate referral code request
 */
export const validateReferralCodeSchema = {
  params: Type.Object({
    code: Type.String()
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        isValid: Type.Boolean(),
        referrerId: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        campaignId: Type.Optional(Type.String())
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Track referral visit request
 */
export const trackReferralVisitSchema = {
  body: Type.Object({
    code: Type.String(),
    visitorData: Type.Object({
      visitor_id: Type.Optional(Type.String()),
      ip_address: Type.String(),
      user_agent: Type.String(),
      landing_page: Type.String(),
      utm_source: Type.Optional(Type.String()),
      utm_medium: Type.Optional(Type.String()),
      utm_campaign: Type.Optional(Type.String())
    })
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        success: Type.Boolean()
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Get referral statistics response
 */
export const referralStatsSchema = {
  response: {
    200: Type.Object({
      data: Type.Object({
        totalVisits: Type.Number(),
        uniqueVisitors: Type.Number(),
        conversions: Type.Number(),
        conversionRate: Type.Number(),
        totalRewards: Type.Number(),
        totalPointsAwarded: Type.Number(),
        pendingRewards: Type.Number(),
        rewardsHistory: Type.Object({
          signup: Type.Number(),
          engagement: Type.Number(),
          wallet_connection: Type.Number(),
          points_milestone: Type.Number()
        })
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Get referral conversions response
 */
export const referralConversionsSchema = {
  querystring: Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
    offset: Type.Optional(Type.Number({ minimum: 0, default: 0 }))
  }),
  response: {
    200: Type.Object({
      data: Type.Array(
        Type.Object({
          id: Type.String(),
          referral_code: Type.String(),
          referrer_id: Type.String(),
          visitor_id: Type.Optional(Type.String()),
          ip_hash: Type.String(),
          landing_page: Type.String(),
          created_at: Type.String({ format: 'date-time' }),
          converted_user_id: Type.String(),
          conversion_date: Type.String({ format: 'date-time' }),
          referee_name: Type.Optional(Type.String())
        })
      ),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      }),
      pagination: Type.Object({
        total: Type.Number(),
        limit: Type.Number(),
        offset: Type.Number(),
        hasMore: Type.Boolean()
      })
    })
  }
};

/**
 * Get reward history response
 */
export const rewardHistorySchema = {
  querystring: Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
    offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
    status: Type.Optional(Type.Union([
      Type.String({ enum: ['pending', 'processed', 'rejected'] }),
      Type.Array(Type.String({ enum: ['pending', 'processed', 'rejected'] }))
    ]))
  }),
  response: {
    200: Type.Object({
      data: Type.Array(
        Type.Object({
          id: Type.String(),
          referral_id: Type.String(),
          referrer_id: Type.String(),
          referee_id: Type.String(),
          type: Type.String(),
          points_amount: Type.Number(),
          status: Type.String(),
          created_at: Type.String({ format: 'date-time' }),
          processed_at: Type.Optional(Type.String({ format: 'date-time' })),
          transaction_id: Type.Optional(Type.String()),
          campaign_id: Type.Optional(Type.String())
        })
      ),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      }),
      pagination: Type.Object({
        total: Type.Number(),
        limit: Type.Number(),
        offset: Type.Number(),
        hasMore: Type.Boolean()
      })
    })
  }
};

/**
 * Process reward request
 */
export const processRewardSchema = {
  body: Type.Object({
    referralId: Type.String(),
    type: Type.String({ enum: ['signup', 'engagement', 'wallet_connection', 'points_milestone'] })
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        success: Type.Boolean(),
        alreadyProcessed: Type.Optional(Type.Boolean()),
        rewardId: Type.Optional(Type.String()),
        error: Type.Optional(Type.String())
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Get referral network response
 */
export const referralNetworkSchema = {
  querystring: Type.Object({
    levels: Type.Optional(Type.Number({ minimum: 1, maximum: 3, default: 1 }))
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        userId: Type.String(),
        level: Type.Number(),
        children: Type.Array(
          Type.Object({
            userId: Type.String(),
            referralDate: Type.String({ format: 'date-time' }),
            level: Type.Number(),
            status: Type.String(),
            children: Type.Array(Type.Any())
          })
        ),
        totalReferrals: Type.Number(),
        activeReferrals: Type.Number()
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Create campaign request
 */
export const createCampaignSchema = {
  body: Type.Object({
    name: Type.String({ minLength: 3, maxLength: 50 }),
    description: Type.String({ maxLength: 500 }),
    start_date: Type.String({ format: 'date-time' }),
    end_date: Type.String({ format: 'date-time' }),
    reward_multiplier: Type.Number({ minimum: 1, maximum: 10 }),
    eligibility_criteria: Type.Optional(Type.String({ maxLength: 1000 })),
    max_rewards: Type.Optional(Type.Number({ minimum: 1 })),
    special_code: Type.Optional(Type.String({ minLength: 4, maxLength: 20 })),
    target_audience: Type.Optional(Type.String()),
    status: Type.Optional(Type.String({ enum: ['draft', 'active'] }))
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        id: Type.String(),
        name: Type.String(),
        description: Type.String(),
        start_date: Type.String({ format: 'date-time' }),
        end_date: Type.String({ format: 'date-time' }),
        reward_multiplier: Type.Number(),
        eligibility_criteria: Type.Optional(Type.String()),
        max_rewards: Type.Optional(Type.Number()),
        special_code: Type.Optional(Type.String()),
        target_audience: Type.Optional(Type.String()),
        status: Type.String(),
        created_at: Type.String({ format: 'date-time' }),
        created_by: Type.String()
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Update campaign request
 */
export const updateCampaignSchema = {
  params: Type.Object({
    id: Type.String()
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ minLength: 3, maxLength: 50 })),
    description: Type.Optional(Type.String({ maxLength: 500 })),
    start_date: Type.Optional(Type.String({ format: 'date-time' })),
    end_date: Type.Optional(Type.String({ format: 'date-time' })),
    reward_multiplier: Type.Optional(Type.Number({ minimum: 1, maximum: 10 })),
    eligibility_criteria: Type.Optional(Type.String({ maxLength: 1000 })),
    max_rewards: Type.Optional(Type.Number({ minimum: 1 })),
    special_code: Type.Optional(Type.String({ minLength: 4, maxLength: 20 })),
    target_audience: Type.Optional(Type.String()),
    status: Type.Optional(Type.String({ enum: ['draft', 'active', 'completed', 'cancelled'] }))
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        id: Type.String(),
        name: Type.String(),
        description: Type.String(),
        start_date: Type.String({ format: 'date-time' }),
        end_date: Type.String({ format: 'date-time' }),
        reward_multiplier: Type.Number(),
        eligibility_criteria: Type.Optional(Type.String()),
        max_rewards: Type.Optional(Type.Number()),
        special_code: Type.Optional(Type.String()),
        target_audience: Type.Optional(Type.String()),
        status: Type.String(),
        created_at: Type.String({ format: 'date-time' }),
        created_by: Type.String()
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Get campaigns response
 */
export const getCampaignsSchema = {
  querystring: Type.Object({
    status: Type.Optional(Type.Union([
      Type.String({ enum: ['draft', 'active', 'completed', 'cancelled'] }),
      Type.Array(Type.String({ enum: ['draft', 'active', 'completed', 'cancelled'] }))
    ])),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
    offset: Type.Optional(Type.Number({ minimum: 0, default: 0 }))
  }),
  response: {
    200: Type.Object({
      data: Type.Array(
        Type.Object({
          id: Type.String(),
          name: Type.String(),
          description: Type.String(),
          start_date: Type.String({ format: 'date-time' }),
          end_date: Type.String({ format: 'date-time' }),
          reward_multiplier: Type.Number(),
          eligibility_criteria: Type.Optional(Type.String()),
          max_rewards: Type.Optional(Type.Number()),
          special_code: Type.Optional(Type.String()),
          target_audience: Type.Optional(Type.String()),
          status: Type.String(),
          created_at: Type.String({ format: 'date-time' }),
          created_by: Type.String()
        })
      ),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      }),
      pagination: Type.Object({
        total: Type.Number(),
        limit: Type.Number(),
        offset: Type.Number(),
        hasMore: Type.Boolean()
      })
    })
  }
};

/**
 * Get campaign performance response
 */
export const campaignPerformanceSchema = {
  params: Type.Object({
    id: Type.String()
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        campaignId: Type.String(),
        name: Type.String(),
        totalVisits: Type.Number(),
        uniqueVisitors: Type.Number(),
        signups: Type.Number(),
        conversionRate: Type.Number(),
        totalRewards: Type.Number(),
        totalPointsAwarded: Type.Number(),
        costPerAcquisition: Type.Number()
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};

/**
 * Generate campaign code request
 */
export const generateCampaignCodeSchema = {
  params: Type.Object({
    id: Type.String()
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        code: Type.String(),
        url: Type.String({ format: 'uri' })
      }),
      meta: Type.Object({
        timestamp: Type.String({ format: 'date-time' })
      })
    })
  }
};
