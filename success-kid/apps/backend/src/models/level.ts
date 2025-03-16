/**
 * Level Model
 * Represents user levels and progression in the system
 */
import { z } from 'zod';

// Level definition schema
export const levelDefinitionSchema = z.object({
  level: z.number().int().positive(),
  title: z.string().min(1).max(100),
  xp_required: z.number().int().nonnegative(),
  points_reward: z.number().int().nonnegative(),
  benefits: z.array(z.string()),
  icon_url: z.string().url().nullable().optional()
});

export type LevelDefinition = z.infer<typeof levelDefinitionSchema>;

// User XP transaction schema
export const xpTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  amount: z.number().int().nonnegative(),
  source: z.string(),
  reference_id: z.string().nullable(),
  created_at: z.coerce.date(),
  description: z.string().nullable()
});

export type XpTransaction = z.infer<typeof xpTransactionSchema>;

// Input DTO for XP transactions
export const createXpTransactionSchema = xpTransactionSchema
  .omit({ id: true, created_at: true })
  .extend({
    reference_id: z.string().nullable().optional(),
    description: z.string().nullable().optional()
  });

export type CreateXpTransactionDto = z.infer<typeof createXpTransactionSchema>;

// User level schema with current XP and level data
export const userLevelSchema = z.object({
  user_id: z.string(),
  level: z.number().int().positive(),
  current_xp: z.number().int().nonnegative(),
  total_xp: z.number().int().nonnegative(),
  updated_at: z.coerce.date()
});

export type UserLevel = z.infer<typeof userLevelSchema>;

// Level up history schema to track progression
export const levelUpHistorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  previous_level: z.number().int().nonnegative(),
  new_level: z.number().int().positive(),
  timestamp: z.coerce.date()
});

export type LevelUpHistory = z.infer<typeof levelUpHistorySchema>;

// Database column mappings
export const levelDefinitionDbMapping = {
  level: 'level',
  title: 'title',
  xp_required: 'xp_required',
  points_reward: 'points_reward',
  benefits: 'benefits',
  icon_url: 'icon_url'
};

export const xpTransactionDbMapping = {
  id: 'id',
  user_id: 'user_id',
  amount: 'amount',
  source: 'source',
  reference_id: 'reference_id',
  created_at: 'created_at',
  description: 'description'
};

export const userLevelDbMapping = {
  user_id: 'user_id',
  level: 'level',
  current_xp: 'current_xp',
  total_xp: 'total_xp',
  updated_at: 'updated_at'
};

export const levelUpHistoryDbMapping = {
  id: 'id',
  user_id: 'user_id',
  previous_level: 'previous_level',
  new_level: 'new_level',
  timestamp: 'timestamp'
};

// Level progress response type for clients
export interface LevelProgress {
  currentLevel: number;
  nextLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  progress: number; // 0-100 percentage
  totalXp: number;
}

// Level up result type
export interface LevelUpResult {
  userId: string;
  previousLevel: number;
  newLevel: number;
  pointsRewarded: number;
  benefits: string[];
}
