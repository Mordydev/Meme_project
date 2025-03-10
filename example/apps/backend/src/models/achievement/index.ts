/**
 * Achievement models for the database
 */

import { EventType } from '../../lib/events';

export interface AchievementModel {
  id: string;
  title: string;
  description: string;
  category: 'battle' | 'content' | 'community' | 'token' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  pointsReward: number;
  criteria: string;
  ruleId?: string; // Reference to achievement rules
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievementModel {
  id: string;
  userId: string;
  achievementId: string;
  progress: number; // 0-100 percentage
  unlockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Achievement rule definition for rule-based achievement tracking
 */
export interface AchievementRule {
  id: string;
  criteriaType: string;
  eventTypes: EventType[];
  checkFunction: (data: any) => Promise<{
    matches: boolean;
    progress?: number;
    completed?: boolean;
  }>;
  levels: {
    id: string; // Achievement ID
    name: string;
    threshold: number;
  }[];
  pointRewards: number[];
}

/**
 * Default achievements data for seeding the database
 */
export const defaultAchievements: Omit<AchievementModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Battle achievements
  {
    title: 'Battle Rookie',
    description: 'Participated in your first battle',
    category: 'battle',
    tier: 'bronze',
    icon: 'trophy-bronze',
    pointsReward: 50,
    criteria: 'Participate in 1 battle',
    ruleId: 'battle_participation'
  },
  {
    title: 'Battle Veteran',
    description: 'Participated in 10 battles',
    category: 'battle',
    tier: 'silver',
    icon: 'trophy-silver',
    pointsReward: 200,
    criteria: 'Participate in 10 battles',
    ruleId: 'battle_participation'
  },
  {
    title: 'Battle Master',
    description: 'Participated in 50 battles',
    category: 'battle',
    tier: 'gold',
    icon: 'trophy-gold',
    pointsReward: 500,
    criteria: 'Participate in 50 battles',
    ruleId: 'battle_participation'
  },
  {
    title: 'First Win',
    description: 'Won your first battle',
    category: 'battle',
    tier: 'silver',
    icon: 'medal-silver',
    pointsReward: 100,
    criteria: 'Win 1 battle',
    ruleId: 'battle_wins'
  },
  {
    title: 'Champion',
    description: 'Won 10 battles',
    category: 'battle',
    tier: 'gold',
    icon: 'medal-gold',
    pointsReward: 1000,
    criteria: 'Win 10 battles',
    ruleId: 'battle_wins'
  },
  {
    title: 'Wild Style Legend',
    description: 'Won a Wild Style battle',
    category: 'battle',
    tier: 'silver',
    icon: 'wild-silver',
    pointsReward: 150,
    criteria: 'Win a Wild Style battle',
    ruleId: 'battle_type_wins'
  },
  {
    title: 'Freestyle King/Queen',
    description: 'Won 5 Freestyle battles',
    category: 'battle',
    tier: 'gold',
    icon: 'mic-gold',
    pointsReward: 300,
    criteria: 'Win 5 Freestyle battles',
    ruleId: 'battle_type_wins'
  },
  
  // Content achievements
  {
    title: 'Content Creator',
    description: 'Created your first content',
    category: 'content',
    tier: 'bronze',
    icon: 'pencil-bronze',
    pointsReward: 50,
    criteria: 'Create 1 content piece',
    ruleId: 'content_creation'
  },
  {
    title: 'Content Producer',
    description: 'Created 10 pieces of content',
    category: 'content',
    tier: 'silver',
    icon: 'pencil-silver',
    pointsReward: 200,
    criteria: 'Create 10 content pieces',
    ruleId: 'content_creation'
  },
  {
    title: 'Content Mogul',
    description: 'Created 50 pieces of content',
    category: 'content',
    tier: 'gold',
    icon: 'pencil-gold',
    pointsReward: 500,
    criteria: 'Create 50 content pieces',
    ruleId: 'content_creation'
  },
  {
    title: 'Popular Creator',
    description: 'Received 100 reactions on your content',
    category: 'content',
    tier: 'silver',
    icon: 'star-silver',
    pointsReward: 150,
    criteria: 'Receive 100 reactions on your content',
    ruleId: 'content_reactions'
  },
  {
    title: 'Viral Sensation',
    description: 'Received 1,000 reactions on your content',
    category: 'content',
    tier: 'gold',
    icon: 'star-gold',
    pointsReward: 500,
    criteria: 'Receive 1,000 reactions on your content',
    ruleId: 'content_reactions'
  },
  
  // Community achievements
  {
    title: 'Community Member',
    description: 'Joined the community',
    category: 'community',
    tier: 'bronze',
    icon: 'person-bronze',
    pointsReward: 10,
    criteria: 'Create an account',
    ruleId: 'account_creation'
  },
  {
    title: 'Community Contributor',
    description: 'Made 10 comments on other content',
    category: 'community',
    tier: 'silver',
    icon: 'person-silver',
    pointsReward: 100,
    criteria: 'Comment 10 times',
    ruleId: 'comment_creation'
  },
  {
    title: 'Community Leader',
    description: 'Gained 100 followers',
    category: 'community',
    tier: 'gold',
    icon: 'person-gold',
    pointsReward: 300,
    criteria: 'Gain 100 followers',
    ruleId: 'follower_count'
  },
  {
    title: 'Conversation Starter',
    description: 'Started 5 discussions that received 10+ comments',
    category: 'community',
    tier: 'silver',
    icon: 'chat-silver',
    pointsReward: 200,
    criteria: 'Start 5 discussions with 10+ comments',
    ruleId: 'discussion_engagement'
  },
  {
    title: 'Network Builder',
    description: 'Follow 50 other users',
    category: 'community',
    tier: 'silver',
    icon: 'network-silver',
    pointsReward: 150,
    criteria: 'Follow 50 users',
    ruleId: 'following_count'
  },
  
  // Token achievements
  {
    title: 'Token Holder',
    description: 'Connected wallet with $WILDNOUT tokens',
    category: 'token',
    tier: 'bronze',
    icon: 'coin-bronze',
    pointsReward: 50,
    criteria: 'Connect wallet with tokens',
    ruleId: 'token_holding'
  },
  {
    title: 'Token Enthusiast',
    description: 'Hold 1,000+ $WILDNOUT tokens',
    category: 'token',
    tier: 'silver',
    icon: 'coin-silver',
    pointsReward: 200,
    criteria: 'Hold 1,000+ tokens',
    ruleId: 'token_holding'
  },
  {
    title: 'Token Whale',
    description: 'Hold 10,000+ $WILDNOUT tokens',
    category: 'token',
    tier: 'gold',
    icon: 'coin-gold',
    pointsReward: 500,
    criteria: 'Hold 10,000+ tokens',
    ruleId: 'token_holding'
  },
  {
    title: 'Day One Investor',
    description: 'Connected wallet within first month of platform launch',
    category: 'token',
    tier: 'gold',
    icon: 'calendar-gold',
    pointsReward: 300,
    criteria: 'Connect wallet in first month',
    ruleId: 'early_wallet_connection'
  },
  
  // Special achievements
  {
    title: 'Early Adopter',
    description: 'Joined during platform launch',
    category: 'special',
    tier: 'gold',
    icon: 'star-gold',
    pointsReward: 200,
    criteria: 'Join during launch period',
    ruleId: 'early_adopter'
  },
  {
    title: 'Featured Creator',
    description: 'Had content featured on the platform',
    category: 'special',
    tier: 'gold',
    icon: 'fire-gold',
    pointsReward: 300,
    criteria: 'Get content featured',
    ruleId: 'featured_content'
  },
  {
    title: 'Rising Star',
    description: 'Ranked in top 10 on weekly leaderboard',
    category: 'special',
    tier: 'gold',
    icon: 'chart-gold',
    pointsReward: 250,
    criteria: 'Reach top 10 on weekly leaderboard',
    ruleId: 'leaderboard_ranking'
  },
  {
    title: 'Completionist',
    description: 'Unlock 15 other achievements',
    category: 'special',
    tier: 'platinum',
    icon: 'trophy-platinum',
    pointsReward: 500,
    criteria: 'Unlock 15 other achievements',
    ruleId: 'achievement_count'
  }
];
