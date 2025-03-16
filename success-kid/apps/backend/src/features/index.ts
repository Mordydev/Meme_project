/**
 * Feature Flag Module
 */
export * from './service';
export * from './middleware';

// Export common feature flags
export const FEATURES = {
  // Points System
  POINTS_REDEMPTION: 'points.redemption',
  POINTS_TRANSFER: 'points.transfer',
  
  // Content
  CONTENT_CREATION: 'content.creation',
  CONTENT_MODERATION: 'content.moderation',
  
  // Wallet
  WALLET_INTEGRATION: 'wallet.integration',
  
  // Social
  SOCIAL_SHARING: 'social.sharing',
  
  // Community
  COMMUNITY_LEADERBOARD: 'community.leaderboard',
  
  // Admin
  ADMIN_DASHBOARD: 'admin.dashboard',
};