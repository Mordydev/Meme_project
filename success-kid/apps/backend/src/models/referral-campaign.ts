/**
 * Referral Campaign Model
 * Represents a time-bound campaign with special referral rewards
 */
import { z } from 'zod';

// Define the campaign status enum
export const CampaignStatusEnum = z.enum([
  'draft', 
  'active', 
  'completed', 
  'cancelled'
]);
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;

// Campaign schema with validation
export const referralCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(50),
  description: z.string().max(500),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  reward_multiplier: z.number().positive().min(1).max(10),
  eligibility_criteria: z.string().nullable(),
  max_rewards: z.number().int().positive().nullable(),
  special_code: z.string().min(4).max(20).nullable(),
  target_audience: z.string().nullable(),
  status: CampaignStatusEnum,
  created_at: z.coerce.date(),
  created_by: z.string()
});

// TypeScript type derived from schema
export type ReferralCampaign = z.infer<typeof referralCampaignSchema>;

// Eligibility criterion model
export interface EligibilityCriterion {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number | boolean;
}

// Input DTOs with validation
export const createCampaignSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  reward_multiplier: z.number().positive().min(1).max(10),
  eligibility_criteria: z.string().nullable().optional(),
  max_rewards: z.number().int().positive().nullable().optional(),
  special_code: z.string().min(4).max(20).nullable().optional(),
  target_audience: z.string().nullable().optional(),
  status: CampaignStatusEnum.optional().default('draft'),
  created_by: z.string()
});

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  reward_multiplier: z.number().positive().min(1).max(10).optional(),
  eligibility_criteria: z.string().nullable().optional(),
  max_rewards: z.number().int().positive().nullable().optional(),
  special_code: z.string().min(4).max(20).nullable().optional(),
  target_audience: z.string().nullable().optional(),
  status: CampaignStatusEnum.optional()
});

export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;

/**
 * Campaign performance metrics
 */
export interface CampaignPerformance {
  campaignId: string;
  name: string;
  totalVisits: number;
  uniqueVisitors: number;
  signups: number;
  conversionRate: number;
  totalRewards: number;
  totalPointsAwarded: number;
  costPerAcquisition: number;
}

/**
 * Campaign reward result
 */
export interface CampaignRewardResult {
  applied: boolean;
  reason?: string;
  campaignId?: string;
  multiplier?: number;
  pointsAwarded?: number;
}

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const referralCampaignDbMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  start_date: 'start_date',
  end_date: 'end_date',
  reward_multiplier: 'reward_multiplier',
  eligibility_criteria: 'eligibility_criteria',
  max_rewards: 'max_rewards',
  special_code: 'special_code',
  target_audience: 'target_audience',
  status: 'status',
  created_at: 'created_at',
  created_by: 'created_by'
};
