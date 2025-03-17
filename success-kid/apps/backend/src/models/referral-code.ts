/**
 * Referral Code Model
 * Represents a user referral code for tracking and attribution
 */
import { z } from 'zod';

// Define the referral code type enum
export const ReferralCodeTypeEnum = z.enum(['standard', 'custom', 'campaign']);
export type ReferralCodeType = z.infer<typeof ReferralCodeTypeEnum>;

// Define the referral code status enum
export const ReferralCodeStatusEnum = z.enum(['active', 'inactive', 'expired']);
export type ReferralCodeStatus = z.infer<typeof ReferralCodeStatusEnum>;

// Referral code schema with validation
export const referralCodeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  code: z.string().min(4).max(20),
  type: ReferralCodeTypeEnum,
  status: ReferralCodeStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  expires_at: z.coerce.date().nullable(),
  campaign_id: z.string().uuid().nullable()
});

// TypeScript type derived from schema
export type ReferralCode = z.infer<typeof referralCodeSchema>;

// Input DTOs with validation
export const createReferralCodeSchema = z.object({
  user_id: z.string(),
  code: z.string().min(4).max(20).optional(),
  type: ReferralCodeTypeEnum.optional().default('standard'),
  status: ReferralCodeStatusEnum.optional().default('active'),
  expires_at: z.coerce.date().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional()
});

export type CreateReferralCodeDto = z.infer<typeof createReferralCodeSchema>;

export const updateReferralCodeSchema = z.object({
  code: z.string().min(4).max(20).optional(),
  type: ReferralCodeTypeEnum.optional(),
  status: ReferralCodeStatusEnum.optional(),
  expires_at: z.coerce.date().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional()
});

export type UpdateReferralCodeDto = z.infer<typeof updateReferralCodeSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const referralCodeDbMapping = {
  id: 'id',
  user_id: 'user_id',
  code: 'code',
  type: 'type',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
  expires_at: 'expires_at',
  campaign_id: 'campaign_id'
};
