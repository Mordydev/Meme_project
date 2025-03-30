import { z } from 'zod';

// --- Response Schemas ---

export const MarketStatsSchema = z.object({
    currentPrice: z.number(),
    change24h: z.number(),
    marketCap: z.number(),
    volume24h: z.number().optional(),
});

export const PriceDataPointSchema = z.object({
    timestamp: z.number(), // Unix timestamp
    price: z.number(),
});

export const MarketMilestoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    targetMarketCap: z.number().positive(),
    achievedAt: z.string().datetime().nullable().optional(), // ISO string
});

export const MilestoneProgressSchema = z.object({
    currentMarketCap: z.number(),
    nextMilestone: MarketMilestoneSchema.nullable(),
    progressPercentage: z.number().min(0).max(100),
    achievedMilestones: z.array(MarketMilestoneSchema),
});

export const MarketTransactionSchema = z.object({
    id: z.string(), // Transaction hash
    timestamp: z.number(), // Unix timestamp
    type: z.enum(['buy', 'sell', 'transfer']),
    amountSKC: z.number(),
    amountQuote: z.number(),
    pricePerSKC: z.number(),
    makerAddress: z.string(),
});

// --- Request Query Schemas ---

export const MarketHistoryQuerySchema = z.object({
    period: z.enum(['1h', '24h', '7d', '30d', 'all']).default('24h').optional(),
    interval: z.string().optional(), // e.g., '5m', '1h' - validation might depend on external API
});

export const MarketTransactionsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
    beforeId: z.string().optional(), // Cursor for pagination
    type: z.enum(['buy', 'sell', 'transfer']).optional(),
});

// --- API Response Schemas (using generic wrapper structure) ---

const MetaSchema = z.object({ timestamp: z.string().datetime() });

export const GetMarketStatsResponseSchema = z.object({
    data: MarketStatsSchema,
    meta: MetaSchema,
});

export const GetMarketPriceHistoryResponseSchema = z.object({
    data: z.array(PriceDataPointSchema),
    meta: MetaSchema,
});

export const GetMarketMilestonesResponseSchema = z.object({
    data: MilestoneProgressSchema,
    meta: MetaSchema,
});

export const GetMarketTransactionsResponseSchema = z.object({
    data: z.array(MarketTransactionSchema),
    meta: MetaSchema,
    pagination: z.object({ // Simple cursor pagination example
        nextCursor: z.string().nullable().optional(),
        limit: z.number().int(),
        hasMore: z.boolean(),
    }).optional(),
});
