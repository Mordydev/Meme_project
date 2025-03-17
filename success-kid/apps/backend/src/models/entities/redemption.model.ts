/**
 * Redemption Models
 * 
 * Defines the models and schemas for the Points-to-Token redemption system.
 */
import { z } from 'zod';

/**
 * Redemption status enumeration
 */
export const RedemptionStatusEnum = z.enum([
  'pending',      // Initial state, awaiting processing
  'processing',   // Being processed by the system
  'pending_confirmation', // Transaction sent to blockchain, awaiting confirmation
  'completed',    // Successfully redeemed
  'failed',       // Failed due to an error
  'cancelled'     // Cancelled by user or admin
]);

export type RedemptionStatus = z.infer<typeof RedemptionStatusEnum>;

/**
 * Redemption record schema
 */
export const redemptionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid redemption ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  points_amount: z.number().positive({ message: 'Points amount must be positive' }),
  token_amount: z.number().positive({ message: 'Token amount must be positive' }),
  wallet_address: z.string().min(20, { message: 'Wallet address is too short' }),
  status: RedemptionStatusEnum.default('pending'),
  transaction_hash: z.string().nullable(),
  created_at: z.coerce.date(),
  processed_at: z.coerce.date().nullable(),
  completed_at: z.coerce.date().nullable(),
  error: z.string().nullable(),
  reference_id: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).default({})
});

export type Redemption = z.infer<typeof redemptionSchema>;

/**
 * Create redemption request schema
 */
export const createRedemptionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  points_amount: z.number().positive({ message: 'Points amount must be positive' }),
  wallet_address: z.string().min(20, { message: 'Wallet address is too short' }),
  reference_id: z.string().optional()
});

export type CreateRedemptionDto = z.infer<typeof createRedemptionSchema>;

/**
 * Update redemption schema
 */
export const updateRedemptionSchema = z.object({
  status: RedemptionStatusEnum.optional(),
  transaction_hash: z.string().optional(),
  processed_at: z.coerce.date().optional(),
  completed_at: z.coerce.date().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type UpdateRedemptionDto = z.infer<typeof updateRedemptionSchema>;

/**
 * Redemption transaction schema
 */
export const redemptionTransactionSchema = z.object({
  id: z.string().uuid(),
  redemption_id: z.string().uuid(),
  transaction_hash: z.string().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  attempts: z.number().int().default(0),
  last_attempt: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  error: z.string().nullable()
});

export type RedemptionTransaction = z.infer<typeof redemptionTransactionSchema>;

/**
 * Weekly redemption limit schema
 */
export const weeklyLimitSchema = z.object({
  user_id: z.string().uuid(),
  week_start: z.coerce.date(),
  week_end: z.coerce.date(),
  total_points: z.number().default(0),
  limit: z.number().default(10000), // Default weekly limit
  remaining: z.number() // Calculated field
});

export type WeeklyLimit = z.infer<typeof weeklyLimitSchema>;

/**
 * Redemption filter options schema
 */
export const redemptionFilterSchema = z.object({
  user_id: z.string().uuid().optional(),
  status: z.array(RedemptionStatusEnum).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  min_points: z.number().optional(),
  max_points: z.number().optional(),
  wallet_address: z.string().optional(),
  transaction_hash: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'points_amount', 'status']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
});

export type RedemptionFilterOptions = z.infer<typeof redemptionFilterSchema>;

/**
 * Redemption eligibility response
 */
export interface EligibilityResult {
  eligible: boolean;
  reasons?: string[];
  limits?: {
    weekly: {
      limit: number;
      used: number;
      remaining: number;
    };
    minimum: number;
  };
  walletVerified?: boolean;
  accountStatus?: string;
}

/**
 * Constants for redemption system
 */
export const REDEMPTION_CONSTANTS = {
  MINIMUM_AMOUNT: 1000, // Minimum 1,000 SP (10 SKC)
  WEEKLY_LIMIT: 10000,  // Maximum 10,000 SP (100 SKC) per week
  CONVERSION_RATIO: 100 // 100 SP = 1 SKC
};
