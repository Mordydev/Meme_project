import { z } from 'zod';
import { PointsSourceEnum } from '../../models/entities/points.model'; // Import the Zod enum object
import { REDEMPTION_CONSTANTS } from '../../models/entities/redemption.model'; // Assuming this exists

// --- Request Schemas ---

export const PointsAwardRequestSchema = z.object({
  data: z.object({
    amount: z.number().int().positive(),
    source: PointsSourceEnum, // Use the Zod enum object directly
    referenceId: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const PointsRedeemRequestSchema = z.object({
  data: z.object({
    amount: z.number().int().min(REDEMPTION_CONSTANTS.MINIMUM_AMOUNT),
    walletAddress: z.string().optional(), // TODO: Add wallet address validation if needed
  }),
});

export const TransactionQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  source: z.string().optional(), // Consider enum validation if sources are fixed
});

export const TrendsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('week').optional(),
  // Add other potential filters like 'source'
});

export const CancelRedemptionParamsSchema = z.object({
  id: z.string(), // TODO: Add specific format validation (e.g., UUID) if applicable
});


// --- Response Schemas ---

export const PointTransactionResponseItemSchema = z.object({
  id: z.string(),
  amount: z.number().int(),
  source: z.string(), // Consider enum
  referenceId: z.string().nullable().optional(),
  createdAt: z.string().datetime(), // Expect ISO string in response
  description: z.string().nullable().optional(),
});

export const CapStatusSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
  resetsAt: z.string().datetime().optional(), // Expect ISO string
});

export const SourceCapStatusSchema = z.object({
  daily: CapStatusSchema,
  weekly: CapStatusSchema,
});

export const WalletBalanceInfoSchema = z.object({
  isConnected: z.boolean(),
  isVerified: z.boolean().optional(),
  address: z.string().optional(),
});

export const RedemptionBalanceInfoSchema = z.object({
  conversionRate: z.number().positive(),
  minimumAmount: z.number().int().positive(),
  weeklyLimit: z.number().int().positive(),
});

export const BalanceResponseSchema = z.object({
  data: z.object({
    balance: z.number().int(),
    transactions: z.array(PointTransactionResponseItemSchema),
    caps: z.record(SourceCapStatusSchema), // Record<string, SourceCapStatusSchema>
    wallet: WalletBalanceInfoSchema,
    redemption: RedemptionBalanceInfoSchema,
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  // Add missing fields to match handler construction and PaginatedRedemptionResult type
  page: z.number().int().positive().optional(), 
  totalPages: z.number().int().nonnegative().optional(),
});

export const TransactionsResponseSchema = z.object({
  data: z.array(PointTransactionResponseItemSchema),
  meta: z.object({ timestamp: z.string().datetime() }),
  pagination: PaginationMetaSchema,
});

export const AwardResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    amount: z.number().int().positive(),
    newBalance: z.number().int(),
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});

export const RedemptionHistoryItemSchema = z.object({
    id: z.string(),
    pointsAmount: z.number().int().positive(),
    tokenAmount: z.number().positive(),
    status: z.string(), // Consider enum: pending, processing, completed, failed, cancelled
    createdAt: z.string().datetime(),
    processedAt: z.string().datetime().nullable().optional(),
    transactionHash: z.string().nullable().optional(),
    walletAddress: z.string(),
});

export const RedemptionsResponseSchema = z.object({
  data: z.array(RedemptionHistoryItemSchema),
  meta: z.object({ timestamp: z.string().datetime() }),
  pagination: PaginationMetaSchema,
});

export const RedeemResponseSchema = z.object({ // For 202 Accepted
  data: z.object({
    success: z.boolean(),
    requestId: z.string(),
    pointsAmount: z.number().int().positive(),
    tokenAmount: z.number().positive(),
    status: z.string(), // Consider enum
    estimatedProcessingTime: z.string().datetime(), 
    walletAddress: z.string(),
    conversionRate: z.number().positive(),
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});

export const CancelRedemptionResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    redemption: z.object({
        id: z.string(),
        status: z.literal('cancelled'), // Ensure status is 'cancelled'
        pointsAmount: z.number().int().positive(),
        refunded: z.literal(true), // Ensure refunded is true
    }),
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});

export const CapsResponseSchema = z.object({
  data: z.object({
    caps: z.record(SourceCapStatusSchema),
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});

export const EligibilityResponseSchema = z.object({
  data: z.object({
    isEligible: z.boolean(),
    reasons: z.array(z.string()).optional(),
    checks: z.object({
        hasEnoughPoints: z.boolean(),
        isWalletConnected: z.boolean(),
        isWalletVerified: z.boolean(),
        isWeeklyCapReached: z.boolean(),
    }),
    details: z.object({
        currentBalance: z.number().int().optional(),
        minimumPoints: z.number().int().positive().optional(),
        walletAddress: z.string().optional(),
        weeklyUsed: z.number().int().nonnegative().optional(),
        weeklyLimit: z.number().int().positive().optional(),
    }).optional(),
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});

export const TrendDataPointSchema = z.object({
    date: z.string(), // Validate format based on period? (e.g., YYYY-MM-DD)
    totalPoints: z.number().int().nonnegative(),
    sources: z.record(z.number().int().nonnegative()).optional(), 
});

export const TrendsResponseSchema = z.object({
  data: z.object({
    period: z.enum(['day', 'week', 'month', 'year']),
    data: z.array(TrendDataPointSchema),
  }),
  meta: z.object({ timestamp: z.string().datetime() }),
});
