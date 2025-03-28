/**
 * Referral Model
 * 
 * Defines the Referral entity, validation schemas, and related data transfer objects.
 * Referrals track user growth through invitations.
 */
import { z } from 'zod';

// Referral Status Enum
export const ReferralStatusEnum = z.enum([
  'pending',         // Registered but not completed onboarding
  'completed',       // Completed onboarding
  'converted',       // Performed significant action (e.g., wallet connection)
  'rewarded',        // Referrer has been rewarded
  'expired',         // Expired without completion
  'invalid'          // Invalid referral (e.g., self-referral attempt)
]);

export type ReferralStatus = z.infer<typeof ReferralStatusEnum>;

// Referral Zod Schema
export const referralSchema = z.object({
  id: z.string().uuid({ message: 'Invalid referral ID format' }),
  referrer_id: z.string().uuid({ message: 'Invalid referrer ID format' }),
  referred_id: z.string().uuid({ message: 'Invalid referred user ID format' }),
  created_at: z.coerce.date(),
  status: ReferralStatusEnum.default('pending'),
  converted_at: z.coerce.date().nullable(),
  rewarded_at: z.coerce.date().nullable(),
  reward_amount: z.number().int().nonnegative().optional(),
  campaign_id: z.string().uuid().optional(),
  referral_code: z.string().optional(),
  source: z.string().optional(),
  
  // Additional metadata
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Referral Type derived from Zod schema
export type Referral = z.infer<typeof referralSchema>;

// Create Referral Input Schema
export const createReferralSchema = z.object({
  referrer_id: z.string().uuid({ message: 'Invalid referrer ID format' }),
  referred_id: z.string().uuid({ message: 'Invalid referred user ID format' }),
  campaign_id: z.string().uuid().optional(),
  referral_code: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
})
.refine(
  data => data.referrer_id !== data.referred_id,
  { message: 'Referrer ID and referred ID cannot be the same', path: ['referred_id'] }
);

// Create Referral DTO Type
export type CreateReferralDto = z.infer<typeof createReferralSchema>;

// Update Referral Input Schema
export const updateReferralSchema = z.object({
  status: ReferralStatusEnum.optional(),
  converted_at: z.coerce.date().nullable().optional(),
  rewarded_at: z.coerce.date().nullable().optional(),
  reward_amount: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Update Referral DTO Type
export type UpdateReferralDto = z.infer<typeof updateReferralSchema>;

// Referral Code Schema
export const referralCodeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  code: z.string()
    .min(6, { message: 'Referral code must be at least 6 characters' })
    .max(20, { message: 'Referral code cannot exceed 20 characters' }),
  created_at: z.coerce.date(),
  expires_at: z.coerce.date().nullable(),
  uses: z.number().int().nonnegative().default(0),
  max_uses: z.number().int().nonnegative().optional(),
  is_active: z.boolean().default(true),
  campaign_id: z.string().uuid().optional()
});

// Referral Code Type
export type ReferralCode = z.infer<typeof referralCodeSchema>;

// Generate Referral Code Input Schema
export const generateReferralCodeSchema = z.object({
  user_id: z.string().uuid(),
  custom_code: z.string()
    .min(6, { message: 'Custom referral code must be at least 6 characters' })
    .max(20, { message: 'Custom referral code cannot exceed 20 characters' })
    .regex(/^[a-zA-Z0-9-_]+$/, { message: 'Custom referral code can only contain alphanumeric characters, hyphens, and underscores' })
    .optional(),
  expires_at: z.coerce.date().optional(),
  max_uses: z.number().int().nonnegative().optional(),
  campaign_id: z.string().uuid().optional()
});

// Generate Referral Code DTO Type
export type GenerateReferralCodeDto = z.infer<typeof generateReferralCodeSchema>;

// Validate Referral Code Input Schema
export const validateReferralCodeSchema = z.object({
  code: z.string()
    .min(6, { message: 'Referral code must be at least 6 characters' })
    .max(20, { message: 'Referral code cannot exceed 20 characters' })
});

// Validate Referral Code DTO Type
export type ValidateReferralCodeDto = z.infer<typeof validateReferralCodeSchema>;

// Referral Campaign Schema
export const referralCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  reward_amount: z.number().int().nonnegative(),
  referred_reward_amount: z.number().int().nonnegative().optional(),
  max_referrals: z.number().int().nonnegative().optional(),
  is_active: z.boolean().default(true),
  requirements: z.record(z.string(), z.any()).default({}),
  metadata: z.record(z.string(), z.any()).default({})
});

// Referral Campaign Type
export type ReferralCampaign = z.infer<typeof referralCampaignSchema>;

// Referral Statistics Type
export const referralStatsSchema = z.object({
  user_id: z.string().uuid(),
  total_referrals: z.number().int().nonnegative(),
  pending_referrals: z.number().int().nonnegative(),
  completed_referrals: z.number().int().nonnegative(),
  converted_referrals: z.number().int().nonnegative(),
  total_rewards: z.number().int().nonnegative(),
  conversion_rate: z.number().min(0).max(100)
});

// Referral Statistics Type
export type ReferralStats = z.infer<typeof referralStatsSchema>;
