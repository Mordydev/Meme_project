/**
 * Achievement models for the database
 */

export interface AchievementModel {
  id: string;
  title: string;
  description: string;
  category: 'battle' | 'content' | 'community' | 'token' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  pointsReward: number;
  criteria: string;
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
  },
  {
    title: 'Battle Veteran',
    description: 'Participated in 10 battles',
    category: 'battle',
    tier: 'silver',
    icon: 'trophy-silver',
    pointsReward: 200,
    criteria: 'Participate in 10 battles',
  },
  {
    title: 'Battle Master',
    description: 'Participated in 50 battles',
    category: 'battle',
    tier: 'gold',
    icon: 'trophy-gold',
    pointsReward: 500,
    criteria: 'Participate in 50 battles',
  },
  {
    title: 'First Win',
    description: 'Won your first battle',
    category: 'battle',
    tier: 'silver',
    icon: 'medal-silver',
    pointsReward: 100,
    criteria: 'Win 1 battle',
  },
  {
    title: 'Champion',
    description: 'Won 10 battles',
    category: 'battle',
    tier: 'gold',
    icon: 'medal-gold',
    pointsReward: 1000,
    criteria: 'Win 10 battles',
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
  },
  {
    title: 'Content Producer',
    description: 'Created 10 pieces of content',
    category: 'content',
    tier: 'silver',
    icon: 'pencil-silver',
    pointsReward: 200,
    criteria: 'Create 10 content pieces',
  },
  {
    title: 'Content Mogul',
    description: 'Created 50 pieces of content',
    category: 'content',
    tier: 'gold',
    icon: 'pencil-gold',
    pointsReward: 500,
    criteria: 'Create 50 content pieces',
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
  },
  {
    title: 'Community Contributor',
    description: 'Made 10 comments on other content',
    category: 'community',
    tier: 'silver',
    icon: 'person-silver',
    pointsReward: 100,
    criteria: 'Comment 10 times',
  },
  {
    title: 'Community Leader',
    description: 'Gained 100 followers',
    category: 'community',
    tier: 'gold',
    icon: 'person-gold',
    pointsReward: 300,
    criteria: 'Gain 100 followers',
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
  },
  {
    title: 'Token Enthusiast',
    description: 'Hold 1,000+ $WILDNOUT tokens',
    category: 'token',
    tier: 'silver',
    icon: 'coin-silver',
    pointsReward: 200,
    criteria: 'Hold 1,000+ tokens',
  },
  {
    title: 'Token Whale',
    description: 'Hold 10,000+ $WILDNOUT tokens',
    category: 'token',
    tier: 'gold',
    icon: 'coin-gold',
    pointsReward: 500,
    criteria: 'Hold 10,000+ tokens',
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
  },
  {
    title: 'Featured Creator',
    description: 'Had content featured on the platform',
    category: 'special',
    tier: 'gold',
    icon: 'fire-gold',
    pointsReward: 300,
    criteria: 'Get content featured',
  }
];
