/**
 * Level Model
 * 
 * Defines the Level entity, validation schemas, and related data transfer objects.
 * This includes level definitions, user level tracking, and XP calculation.
 */
import { z } from 'zod';

// Level benefits enum
export const LevelBenefitEnum = z.enum([
  'custom_avatar_frame',
  'post_formatting',
  'profile_customization',
  'custom_name_color',
  'post_highlighting',
  'special_emotes',
  'profile_banner_options',
  'comment_spotlight',
  'special_effects'
]);
export type LevelBenefit = z.infer<typeof LevelBenefitEnum>;

// Level Schema
export const levelSchema = z.object({
  level: z.number().int().positive(),
  title: z.string(),
  xp_required: z.number().int().nonnegative(),
  benefits: z.array(LevelBenefitEnum),
  points_reward: z.number().int().nonnegative().default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Level = z.infer<typeof levelSchema>;

// User Level Schema
export const userLevelSchema = z.object({
  user_id: z.string(),
  level: z.number().int().positive(),
  current_xp: z.number().int().nonnegative(),
  updated_at: z.coerce.date()
});
export type UserLevel = z.infer<typeof userLevelSchema>;

// XP Transaction Schema
export const xpTransactionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid XP transaction ID format' }),
  user_id: z.string(),
  amount: z.number().int(),
  source: z.string(),
  reference_id: z.string().nullable(),
  created_at: z.coerce.date()
});
export type XpTransaction = z.infer<typeof xpTransactionSchema>;

// XP Source enum - represents different ways to earn XP
export const XpSourceEnum = z.enum([
  'content_creation',
  'comment',
  'reaction_received',
  'daily_login',
  'streak_bonus',
  'achievement',
  'referral',
  'referral_conversion',
  'milestone',
  'profile_completion',
  'wallet_connection',
  'admin_award',
  'content_featured',
  'special_event',
  'competition_prize'
]);
export type XpSource = z.infer<typeof XpSourceEnum>;

// XP Values - how much XP is earned for each source
export const XP_VALUES: Record<XpSource, number> = {
  content_creation: 10,
  comment: 5,
  reaction_received: 1,
  daily_login: 5,
  streak_bonus: 10,
  achievement: 20,
  referral: 50,
  referral_conversion: 100,
  milestone: 25,
  profile_completion: 25,
  wallet_connection: 50,
  admin_award: 0,  // Custom value set by admin
  content_featured: 50,
  special_event: 25,
  competition_prize: 100
};

// XP Award Data Schema
export const xpAwardDataSchema = z.object({
  userId: z.string(),
  amount: z.number().int(),
  source: XpSourceEnum,
  referenceId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});
export type XpAwardData = z.infer<typeof xpAwardDataSchema>;

// Level Progress Schema
export const levelProgressSchema = z.object({
  previousLevel: z.number().int().positive(),
  currentLevel: z.number().int().positive(),
  totalXp: z.number().int().nonnegative(),
  xpGained: z.number().int(),
  xpToNextLevel: z.number().int().nonnegative(),
  levelUp: z.boolean(),
  levelProgress: z.number().min(0).max(100)
});
export type LevelProgress = z.infer<typeof levelProgressSchema>;

// Level Up Event Structure
export interface LevelUpEvent {
  userId: string;
  previousLevel: number;
  newLevel: number;
  benefits: LevelBenefit[];
  pointsRewarded?: number;
}

// Predefined level thresholds
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  500,    // Level 2
  1000,   // Level 3
  2500,   // Level 4
  5000,   // Level 5
  10000,  // Level 6
  50000,  // Level 7
  75000,  // Level 8
  100000, // Level 9
  150000  // Level 10
];

// Predefined level data with benefits
export const LEVEL_DATA: Omit<Level, 'created_at' | 'updated_at'>[] = [
  {
    level: 1,
    title: 'New Arrival',
    xp_required: 0,
    benefits: [],
    points_reward: 0
  },
  {
    level: 2,
    title: 'First Steps',
    xp_required: 500,
    benefits: ['custom_avatar_frame'],
    points_reward: 100
  },
  {
    level: 3,
    title: 'Sand Grabber',
    xp_required: 1000,
    benefits: ['post_formatting'],
    points_reward: 200
  },
  {
    level: 4,
    title: 'Small Victory',
    xp_required: 2500,
    benefits: ['profile_customization'],
    points_reward: 300
  },
  {
    level: 5,
    title: 'Determined',
    xp_required: 5000,
    benefits: ['custom_name_color'],
    points_reward: 500
  },
  {
    level: 6,
    title: 'Achiever',
    xp_required: 10000,
    benefits: ['post_highlighting'],
    points_reward: 1000
  },
  {
    level: 7,
    title: 'Winner',
    xp_required: 50000,
    benefits: ['special_emotes'],
    points_reward: 2500
  },
  {
    level: 8,
    title: 'Celebrated',
    xp_required: 75000,
    benefits: ['profile_banner_options'],
    points_reward: 3000
  },
  {
    level: 9,
    title: 'Success Story',
    xp_required: 100000,
    benefits: ['comment_spotlight'],
    points_reward: 4000
  },
  {
    level: 10,
    title: 'Victory Kid',
    xp_required: 150000,
    benefits: ['special_effects'],
    points_reward: 5000
  }
];
