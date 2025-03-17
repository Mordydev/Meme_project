/**
 * Referral System Configuration
 * 
 * Contains configuration options for the referral system
 */

export const REFERRAL_CONFIG = {
  // Code generation configuration
  codeLength: 8,
  codePrefix: 'SK',
  maxCustomCodeLength: 20,
  
  // Network configuration
  maxNetworkDepth: 3,
  
  // Reward amounts for different action types
  rewardAmounts: {
    signup: 500,        // Points for referring a user who signs up
    engagement: 250,    // Points for referred user engagement milestones
    wallet_connection: 250, // Points when referred user connects wallet
    points_milestone: 500   // Points when referred user reaches points milestones
  },
  
  // Rate limiting
  dailyTrackingLimit: 100,  // Maximum referral tracking records per referrer per day
  
  // Campaign configuration
  maxActiveCampaigns: 3,    // Maximum number of active campaigns
  minCampaignDuration: 24,  // Minimum campaign duration in hours
  maxCampaignDuration: 720, // Maximum campaign duration in hours (30 days)
  
  // Campaign rewards configuration
  campaignRewards: {
    defaultMultiplier: 2,   // Default reward multiplier for campaigns
    maxMultiplier: 5,       // Maximum allowed multiplier
    minMultiplier: 1.2      // Minimum allowed multiplier
  },
  
  // Verification configuration
  verification: {
    selfReferralThreshold: 0.8,      // Confidence threshold for self-referral detection
    batchSignupThreshold: 5,         // Number of signups in short period to trigger signal
    suspiciousTimingThreshold: 10,   // Seconds between visit and conversion to consider suspicious
    confidenceThresholds: {
      approve: 0.8,  // Above this is automatically approved
      review: 0.4,   // Between review and approve needs manual review
      reject: 0.2    // Below this is automatically rejected
    },
    signalWeights: {
      'self_referral': 0.7,
      'batch_signup': 0.5,
      'timing_pattern': 0.4,
      'quality_signals': 0.3,
      'ip_match': 0.6,
      'device_match': 0.5,
      'network_cluster': 0.6
    }
  }
};
