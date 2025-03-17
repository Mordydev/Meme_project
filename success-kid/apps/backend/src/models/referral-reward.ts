/**
 * Referral Reward Model
 * Represents rewards earned through the referral program
 */
import { z } from 'zod';

// Define the reward type enum
export const RewardTypeEnum = z.enum([
  'signup', 
  'engagement', 
  'wallet_connection', 
  'points_milestone'
]);
export type RewardType = z.infer<typeof RewardTypeEnum>;

// Define the reward status enum
export const RewardStatusEnum = z.enum([
  'pending', 
  'processed', 
  'rejected'
]);
export type RewardStatus = z.infer<typeof RewardStatusEnum>;

// Referral reward schema with validation
export const referralRewardSchema = z.object({
  id: z.string().uuid(),
  referral_id: z.string(),
  referrer_id: z.string(),
  referee_id: z.string(),
  type: RewardTypeEnum,
  points_amount: z.number().int().positive(),
  status: RewardStatusEnum,
  created_at: z.coerce.date(),
  processed_at: z.coerce.date().nullable(),
  transaction_id: z.string().nullable(),
  campaign_id: z.string().uuid().nullable()
});

// TypeScript type derived from schema
export type ReferralReward = z.infer<typeof referralRewardSchema>;

// Input DTOs with validation
export const createReferralRewardSchema = z.object({
  referral_id: z.string(),
  referrer_id: z.string(),
  referee_id: z.string(),
  type: RewardTypeEnum,
  points_amount: z.number().int().positive(),
  status: RewardStatusEnum.optional().default('pending'),
  processed_at: z.coerce.date().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional()
});

export type CreateReferralRewardDto = z.infer<typeof createReferralRewardSchema>;

export const updateReferralRewardSchema = z.object({
  status: RewardStatusEnum.optional(),
  processed_at: z.coerce.date().nullable().optional(),
  transaction_id: z.string().nullable().optional()
});

export type UpdateReferralRewardDto = z.infer<typeof updateReferralRewardSchema>;

// Reward result type
export const rewardResultSchema = z.object({
  success: z.boolean(),
  alreadyProcessed: z.boolean().optional(),
  conditionsNotMet: z.boolean().optional(),
  rewardId: z.string().optional(),
  error: z.string().optional()
});

export type RewardResult = z.infer<typeof rewardResultSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const referralRewardDbMapping = {
  id: 'id',
  referral_id: 'referral_id',
  referrer_id: 'referrer_id',
  referee_id: 'referee_id',
  type: 'type',
  points_amount: 'points_amount',
  status: 'status',
  created_at: 'created_at',
  processed_at: 'processed_at',
  transaction_id: 'transaction_id',
  campaign_id: 'campaign_id'
};
