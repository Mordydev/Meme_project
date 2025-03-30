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

// Redemption Zod Schema (using camelCase to match Drizzle schema/results)
export const redemptionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid redemption ID format' }),
  userId: z.string().uuid({ message: 'Invalid user ID format' }), // camelCase
  pointsAmount: z.number().int().positive({ message: 'Points amount must be a positive integer' }) // camelCase
    .min(1000, { message: 'Minimum redemption amount is 1,000 points' }),
  tokenAmount: z.number().positive({ message: 'Token amount must be positive' }), // camelCase
  walletAddress: z.string().min(1, { message: 'Wallet address is required' }), // camelCase
  status: RedemptionStatusEnum,
  createdAt: z.coerce.date(), // camelCase
  processedAt: z.coerce.date().nullable(), // camelCase
  transactionHash: z.string().nullable(), // camelCase
  pointsTransactionId: z.string().uuid().nullable(), // camelCase
  errorMessage: z.string().nullable(), // camelCase
  batchId: z.string().nullable() // camelCase
});

// TypeScript Redemption Type derived from Zod schema (now camelCase)
export type Redemption = z.infer<typeof redemptionSchema>;

// Create Redemption Request Input Schema (already camelCase)
export const createRedemptionRequestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  pointsAmount: z.number().int().positive({ message: 'Points amount must be a positive integer' })
    .min(1000, { message: 'Minimum redemption amount is 1,000 points' }),
  walletAddress: z.string().min(1, { message: 'Wallet address is required' })
});

// Create Redemption Request DTO Type (already camelCase)
export type CreateRedemptionRequestDto = z.infer<typeof createRedemptionRequestSchema>;

// Update Redemption Status Input Schema (already camelCase)
export const updateRedemptionStatusSchema = z.object({
  id: z.string().uuid({ message: 'Invalid redemption ID format' }),
  status: RedemptionStatusEnum,
  transactionHash: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  processedAt: z.date().optional()
});

// Update Redemption Status DTO Type (already camelCase)
export type UpdateRedemptionStatusDto = z.infer<typeof updateRedemptionStatusSchema>;

// Redemption Batch Input Schema (using camelCase)
export const redemptionBatchSchema = z.object({
  id: z.string().uuid({ message: 'Invalid batch ID format' }),
  status: RedemptionStatusEnum,
  createdAt: z.coerce.date(), // camelCase
  processedAt: z.coerce.date().nullable(), // camelCase
  redemptionCount: z.number().int().nonnegative(), // camelCase
  totalPoints: z.number().int().nonnegative(), // camelCase
  totalTokens: z.number().positive() // camelCase
});

// Redemption Batch Type (now camelCase)
export type RedemptionBatch = z.infer<typeof redemptionBatchSchema>;

// Redemption Transaction Status Enum (subset of RedemptionStatus)
export const RedemptionTransactionStatusEnum = z.enum([
  'queued',      // Waiting to be processed by the transaction service
  'processing',  // Transaction submitted to blockchain
  'confirmed',   // Transaction confirmed on blockchain
  'failed'       // Transaction failed
]);
export type RedemptionTransactionStatus = z.infer<typeof RedemptionTransactionStatusEnum>;

// Redemption Transaction Schema (using camelCase)
export const redemptionTransactionSchema = z.object({
    id: z.string().uuid(),
    redemptionId: z.string().uuid(), // camelCase
    status: RedemptionTransactionStatusEnum,
    createdAt: z.coerce.date(), // camelCase
    processedAt: z.coerce.date().nullable(), // camelCase
    transactionHash: z.string().nullable(), // camelCase
    errorMessage: z.string().nullable(), // camelCase
});
// Redemption Transaction Type (now camelCase)
export type RedemptionTransaction = z.infer<typeof redemptionTransactionSchema>;

// Redemption Filter Options Type (already camelCase)
export interface RedemptionFilterOptions {
    page: number;
    limit: number;
    userId?: string;
    status?: RedemptionStatus;
    batchId?: string;
    startDate?: Date;
    endDate?: Date;
}

// Redemption Result Interface (Exported)
export interface RedemptionResult {
  success: boolean;
  redemption: Redemption; 
  message?: string;
}

// Pagination Meta Interface (Exported)
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean; // Added optional hasMore
}

// Paginated Redemption Result Interface (Exported)
export interface PaginatedRedemptionResult {
  data: Redemption[]; 
  pagination: PaginationMeta; // Use the exported interface
}

// Eligibility Result Interface (Exported) - Mirroring the one in eligibility service
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
  walletVerified: boolean;
  accountStatus: string; 
}


// Redemption Constants
export const REDEMPTION_CONSTANTS = {
  CONVERSION_RATE: 100,        // 100 SP = 1 SKC 
  CONVERSION_RATIO: 100,       // 100 SP = 1 SKC 
  MINIMUM_AMOUNT: 1000,        // 1,000 SP (10 SKC)
  WEEKLY_LIMIT: 10000,         // 10,000 SP per week (100 SKC) 
  PROCESSING_INTERVAL_DAYS: 7, // Process redemptions every 7 days 
  BATCH_SIZE_LIMIT: 1000,      // Maximum redemptions per batch
  POINTS_EXPIRY_DAYS: 365      // Points expire after 365 days of inactivity
};
