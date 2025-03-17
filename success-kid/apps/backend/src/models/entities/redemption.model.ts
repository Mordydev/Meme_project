/**
 * Redemption Model
 * 
 * Defines the Redemption entity, validation schemas, and related data transfer objects.
 * Redemptions convert Success Points to SKC tokens.
 */
import { z } from 'zod';

// Redemption Status Enum
export const RedemptionStatusEnum = z.enum([
  'pending',     // Initial state, waiting to be processed
  'processing',  // Being processed (blockchain transaction in progress)
  'completed',   // Successfully completed
  'failed',      // Failed to process
  'cancelled'    // Cancelled by user or admin
]);

export type RedemptionStatus = z.infer<typeof RedemptionStatusEnum>;

// Redemption Transaction Zod Schema
export const redemptionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid redemption ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  points_amount: z.number().int().positive({ message: 'Points amount must be a positive integer' })
    .min(1000, { message: 'Minimum redemption amount is 1,000 points' }),
  token_amount: z.number().positive({ message: 'Token amount must be positive' }),
  wallet_address: z.string().min(1, { message: 'Wallet address is required' }),
  status: RedemptionStatusEnum,
  created_at: z.coerce.date(),
  processed_at: z.coerce.date().nullable(),
  transaction_hash: z.string().nullable(),
  points_transaction_id: z.string().uuid().nullable(),
  error_message: z.string().nullable(),
  batch_id: z.string().nullable()
});

// TypeScript Redemption Type derived from Zod schema
export type Redemption = z.infer<typeof redemptionSchema>;

// Create Redemption Request Input Schema
export const createRedemptionRequestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  pointsAmount: z.number().int().positive({ message: 'Points amount must be a positive integer' })
    .min(1000, { message: 'Minimum redemption amount is 1,000 points' }),
  walletAddress: z.string().min(1, { message: 'Wallet address is required' })
});

// Create Redemption Request DTO Type
export type CreateRedemptionRequestDto = z.infer<typeof createRedemptionRequestSchema>;

// Update Redemption Status Input Schema
export const updateRedemptionStatusSchema = z.object({
  id: z.string().uuid({ message: 'Invalid redemption ID format' }),
  status: RedemptionStatusEnum,
  transactionHash: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  processedAt: z.date().optional()
});

// Update Redemption Status DTO Type
export type UpdateRedemptionStatusDto = z.infer<typeof updateRedemptionStatusSchema>;

// Redemption Batch Input Schema
export const redemptionBatchSchema = z.object({
  id: z.string().uuid({ message: 'Invalid batch ID format' }),
  status: RedemptionStatusEnum,
  created_at: z.coerce.date(),
  processed_at: z.coerce.date().nullable(),
  redemption_count: z.number().int().nonnegative(),
  total_points: z.number().int().nonnegative(),
  total_tokens: z.number().positive()
});

// Redemption Batch Type
export type RedemptionBatch = z.infer<typeof redemptionBatchSchema>;

// Redemption Constants
export const REDEMPTION_CONSTANTS = {
  CONVERSION_RATE: 100,        // 100 SP = 1 SKC
  MINIMUM_AMOUNT: 1000,        // 1,000 SP (10 SKC)
  WEEKLY_CAP: 10000,           // 10,000 SP per week (100 SKC)
  PROCESSING_INTERVAL: 7,      // Process redemptions every 7 days
  BATCH_SIZE_LIMIT: 1000,      // Maximum redemptions per batch
  POINTS_EXPIRY_DAYS: 365      // Points expire after 365 days of inactivity
};
