/**
 * Redemption Model
 * 
 * Defines the Redemption entity, validation schemas, and related data transfer objects.
 * Redemptions represent the conversion of Success Points to SKC tokens.
 */
import { z } from 'zod';

// Redemption Status Enum
export const RedemptionStatusEnum = z.enum([
  'pending',          // Initial state, awaiting processing
  'processing',       // Being processed by the system
  'confirming',       // Waiting for blockchain confirmation
  'completed',        // Successfully processed and confirmed
  'failed',           // Processing failed
  'cancelled',        // Cancelled by user or admin
  'refunded'          // Points refunded due to failure
]);

export type RedemptionStatus = z.infer<typeof RedemptionStatusEnum>;

// Failure Reason Enum
export const FailureReasonEnum = z.enum([
  'insufficient_points',       // User doesn't have enough points
  'wallet_not_verified',       // Wallet not verified
  'blockchain_error',          // Error during blockchain transaction
  'treasury_insufficient',     // Not enough tokens in treasury
  'network_congestion',        // Blockchain network congestion
  'timeout',                   // Transaction timed out
  'transaction_rejected',      // Transaction rejected by blockchain
  'system_error',              // Internal system error
  'suspicious_activity',       // Flagged for suspicious activity
  'manual_rejection',          // Manually rejected by admin
  'other'                      // Other reason
]);

export type FailureReason = z.infer<typeof FailureReasonEnum>;

// Redemption Zod Schema
export const redemptionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid redemption ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  points_amount: z.number().int().positive({ message: 'Points amount must be a positive integer' }),
  token_amount: z.number().positive({ message: 'Token amount must be positive' }),
  wallet_address: z.string()
    .min(20, { message: 'Wallet address is too short' })
    .max(255, { message: 'Wallet address is too long' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Wallet address must contain only alphanumeric characters' }),
  status: RedemptionStatusEnum.default('pending'),
  transaction_hash: z.string().nullable().optional(),
  created_at: z.coerce.date(),
  processed_at: z.coerce.date().nullable().optional(),
  completed_at: z.coerce.date().nullable().optional(),
  error_message: z.string().nullable().optional(),
  failure_reason: FailureReasonEnum.nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Redemption Type derived from Zod schema
export type Redemption = z.infer<typeof redemptionSchema>;

// Create Redemption Input Schema
export const createRedemptionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  points_amount: z.number().int().positive({ message: 'Points amount must be a positive integer' }),
  wallet_address: z.string()
    .min(20, { message: 'Wallet address is too short' })
    .max(255, { message: 'Wallet address is too long' }),
  idempotency_key: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Create Redemption DTO Type
export type CreateRedemptionDto = z.infer<typeof createRedemptionSchema>;

// Update Redemption Input Schema
export const updateRedemptionSchema = z.object({
  status: RedemptionStatusEnum.optional(),
  transaction_hash: z.string().nullable().optional(),
  processed_at: z.coerce.date().nullable().optional(),
  completed_at: z.coerce.date().nullable().optional(),
  error_message: z.string().nullable().optional(),
  failure_reason: FailureReasonEnum.nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Update Redemption DTO Type
export type UpdateRedemptionDto = z.infer<typeof updateRedemptionSchema>;

// Redemption Request Input Schema (for API/service layer)
export const redemptionRequestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  pointsAmount: z.number().int()
    .positive({ message: 'Points amount must be a positive integer' })
    .refine(val => val % 100 === 0, { message: 'Points amount must be a multiple of 100' })
    .refine(val => val >= 1000, { message: 'Minimum redemption amount is 1000 points (10 tokens)' }),
  walletAddress: z.string()
    .min(20, { message: 'Wallet address is too short' })
    .max(255, { message: 'Wallet address is too long' }),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Redemption Request Type
export type RedemptionRequest = z.infer<typeof redemptionRequestSchema>;

// Redemption History Query Schema
export const redemptionHistoryQuerySchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  status: RedemptionStatusEnum.array().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

// Redemption History Query Type
export type RedemptionHistoryQuery = z.infer<typeof redemptionHistoryQuerySchema>;

// Redemption Statistics Schema
export const redemptionStatisticsSchema = z.object({
  total_redemptions: z.number().int().nonnegative(),
  total_points_redeemed: z.number().int().nonnegative(),
  total_tokens_transferred: z.number().nonnegative(),
  success_rate: z.number().min(0).max(100),
  average_processing_time: z.number().nonnegative(), // in seconds
  average_redemption_size: z.number().nonnegative()
});

// Redemption Statistics Type
export type RedemptionStatistics = z.infer<typeof redemptionStatisticsSchema>;

// Redemption Constants
export const REDEMPTION_CONSTANTS = {
  CONVERSION_RATE: 100,            // 100 SP = 1 SKC
  MINIMUM_REDEMPTION: 1000,        // 1000 SP = 10 SKC
  WEEKLY_REDEMPTION_CAP: 10000,    // 10,000 SP = 100 SKC per week
  PROCESSING_TIMEOUT: 15 * 60 * 1000, // 15 minutes in milliseconds
  CONFIRMATION_REQUIRED: 3,        // Number of blockchain confirmations required
  MAX_RETRY_ATTEMPTS: 3            // Maximum retry attempts for failed transactions
};
