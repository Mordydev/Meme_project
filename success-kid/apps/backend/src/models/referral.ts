/**
 * Referral Model
 * Represents a user referral relationship
 */
import { z } from 'zod';

// Define the referral status enum
export const ReferralStatusEnum = z.enum(['pending', 'converted', 'expired', 'rejected']);
export type ReferralStatus = z.infer<typeof ReferralStatusEnum>;

// Referral schema with validation
export const referralSchema = z.object({
  id: z.string().uuid(),
  referrer_id: z.string(),
  referred_id: z.string(),
  created_at: z.coerce.date(),
  status: ReferralStatusEnum,
  converted_at: z.coerce.date().nullable()
});

// TypeScript type derived from schema
export type Referral = z.infer<typeof referralSchema>;

// Input DTOs with validation
export const createReferralSchema = z.object({
  referrer_id: z.string(),
  referred_id: z.string(),
  status: ReferralStatusEnum.optional()
});

export type CreateReferralDto = z.infer<typeof createReferralSchema>;

export const updateReferralSchema = z.object({
  status: ReferralStatusEnum.optional(),
  converted_at: z.coerce.date().nullable().optional()
});

export type UpdateReferralDto = z.infer<typeof updateReferralSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const referralDbMapping = {
  id: 'id',
  referrer_id: 'referrer_id',
  referred_id: 'referred_id',
  created_at: 'created_at',
  status: 'status',
  converted_at: 'converted_at'
};
