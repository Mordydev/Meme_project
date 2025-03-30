/**
 * Points Model
 * 
 * Defines the PointsTransaction entity, validation schemas, and related data transfer objects.
 * Success Points are earned through participation and can be redeemed for tokens.
 */
import { z } from 'zod';

// Points Source Enum for categorizing points transactions
export const PointsSourceEnum = z.enum([
  'content_creation',       // Creating content
  'comment',                // Commenting on content
  'reaction_received',      // Receiving likes/reactions on content
  'daily_login',            // Daily login bonus
  'streak_bonus',           // Consecutive day login bonus
  'achievement',            // Unlocking achievements
  'referral',               // Referring new users
  'referral_conversion',    // When referred user completes onboarding
  'milestone',              // Reaching platform milestones
  'profile_completion',     // Completing profile
  'wallet_connection',      // Connecting wallet
  'redemption',             // Points redemption (negative)
  'admin_award',            // Manual award by admin
  'content_featured',       // Content featured by moderators
  'special_event',          // Special platform events
  'competition_prize',      // Winning platform competitions
  'transfer_in',            // Transfer from another user
  'transfer_out',           // Transfer to another user
  'redemption_refund'       // Points refunded from a failed/cancelled redemption
]);

export type PointsSource = z.infer<typeof PointsSourceEnum>;

// Points Transaction Zod Schema (using camelCase)
export const pointsTransactionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid transaction ID format' }),
  userId: z.string().uuid({ message: 'Invalid user ID format' }), // camelCase
  amount: z.number().int({ message: 'Points amount must be an integer' })
    .refine(val => val !== 0, { message: 'Points amount cannot be zero' }),
  source: PointsSourceEnum,
  referenceId: z.string().nullable(), // camelCase
  createdAt: z.coerce.date(), // camelCase
  description: z.string().max(500).nullable(),
  
  // Additional metadata for specific transaction types
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Points Transaction Type derived from Zod schema (now camelCase)
export type PointsTransaction = z.infer<typeof pointsTransactionSchema>;

// Create Points Transaction Input Schema (using camelCase)
export const createPointsTransactionSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }), // camelCase
  amount: z.number().int({ message: 'Points amount must be an integer' })
    .refine(val => val !== 0, { message: 'Points amount cannot be zero' }),
  source: PointsSourceEnum,
  referenceId: z.string().nullable().optional(), // camelCase
  description: z.string().max(500).nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Create Points Transaction DTO Type (now camelCase)
export type CreatePointsTransactionDto = z.infer<typeof createPointsTransactionSchema>;

// Points Award Input Schema (already camelCase)
export const pointsAwardSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int().positive({ message: 'Award amount must be a positive integer' }),
  source: PointsSourceEnum,
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Points Award Type (already camelCase)
export type PointsAwardData = z.infer<typeof pointsAwardSchema>;

// Points Deduction Input Schema (already camelCase)
export const pointsDeductionSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int().positive({ message: 'Deduction amount must be a positive integer' }),
  source: PointsSourceEnum,
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Points Deduction Type (already camelCase)
export type PointsDeductionData = z.infer<typeof pointsDeductionSchema>;

// Points Transfer Input Schema (already camelCase)
export const pointsTransferSchema = z.object({
  fromUserId: z.string().uuid({ message: 'Invalid source user ID format' }),
  toUserId: z.string().uuid({ message: 'Invalid destination user ID format' }),
  amount: z.number().int().positive({ message: 'Transfer amount must be a positive integer' }),
  source: z.string().default('transfer'),
  description: z.string().max(500).optional()
});

// Points Transfer Type (already camelCase)
export type PointsTransferData = z.infer<typeof pointsTransferSchema>;

// Points Balance Type (using camelCase)
export const pointsBalanceSchema = z.object({
  userId: z.string().uuid(),
  total: z.number().int(),
  availableForRedemption: z.number().int(),
  lifetimeEarned: z.number().int(),
  lifetimeSpent: z.number().int(),
  lastTransaction: z.coerce.date().nullable()
});

// Points Balance Type (now camelCase)
export type PointsBalance = z.infer<typeof pointsBalanceSchema>;

// Daily Cap Type (using camelCase)
export const dailyCapSchema = z.object({
  source: PointsSourceEnum,
  limit: z.number().int().positive(),
  current: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resetsAt: z.coerce.date()
});

// Daily Cap Type (now camelCase)
export type DailyCap = z.infer<typeof dailyCapSchema>;

// Points Caps Configuration
export const POINTS_CAPS = {
  content_creation: 200,    // Max 200 points/day from content
  comment: 150,             // Max 150 points/day from comments
  reaction_received: 100,   // Max 100 points/day from reactions
  daily_login: 20,          // Once per day
  referral: 500,            // Per unique referral
  // Other caps...
};

// Points Values Configuration
export const POINTS_VALUES = {
  content_creation: 50,     // Points per content creation
  comment: 15,              // Points per comment
  reaction_received: 5,     // Points per reaction received
  daily_login: 20,          // Daily login bonus
  profile_completion: 100,  // One-time bonus
  wallet_connection: 50,    // One-time bonus
  streak_bonus: 0,          // TODO: Define value
  achievement: 0,           // Points awarded per achievement definition
  referral: 0,              // TODO: Define value
  referral_conversion: 0,   // TODO: Define value
  milestone: 0,             // TODO: Define value
  redemption: 0,            // N/A - handled by deduction
  admin_award: 0,           // Variable
  content_featured: 0,      // TODO: Define value
  special_event: 0,         // Variable
  competition_prize: 0,     // Variable
  transfer_in: 0,           // N/A
  transfer_out: 0,          // N/A
  redemption_refund: 0,     // N/A
};
