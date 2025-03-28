/**
 * Points Model
 * 
 * Defines the UserPoints entity, validation schemas, and related data transfer objects.
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
  'transfer_out'            // Transfer to another user
]);

export type PointsSource = z.infer<typeof PointsSourceEnum>;

// Points Transaction Zod Schema
export const pointsTransactionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid transaction ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int({ message: 'Points amount must be an integer' })
    .refine(val => val !== 0, { message: 'Points amount cannot be zero' }),
  source: PointsSourceEnum,
  reference_id: z.string().nullable(),
  created_at: z.coerce.date(),
  description: z.string().max(500).nullable(),
  
  // Additional metadata for specific transaction types
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Points Transaction Type derived from Zod schema
export type PointsTransaction = z.infer<typeof pointsTransactionSchema>;

// Create Points Transaction Input Schema
export const createPointsTransactionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int({ message: 'Points amount must be an integer' })
    .refine(val => val !== 0, { message: 'Points amount cannot be zero' }),
  source: PointsSourceEnum,
  reference_id: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Create Points Transaction DTO Type
export type CreatePointsTransactionDto = z.infer<typeof createPointsTransactionSchema>;

// Points Award Input Schema (for service layer)
export const pointsAwardSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int().positive({ message: 'Award amount must be a positive integer' }),
  source: PointsSourceEnum,
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Points Award Type
export type PointsAwardData = z.infer<typeof pointsAwardSchema>;

// Points Deduction Input Schema (for service layer)
export const pointsDeductionSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int().positive({ message: 'Deduction amount must be a positive integer' }),
  source: PointsSourceEnum,
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Points Deduction Type
export type PointsDeductionData = z.infer<typeof pointsDeductionSchema>;

// Points Transfer Input Schema (for service layer)
export const pointsTransferSchema = z.object({
  fromUserId: z.string().uuid({ message: 'Invalid source user ID format' }),
  toUserId: z.string().uuid({ message: 'Invalid destination user ID format' }),
  amount: z.number().int().positive({ message: 'Transfer amount must be a positive integer' }),
  source: z.string().default('transfer'),
  description: z.string().max(500).optional()
});

// Points Transfer Type
export type PointsTransferData = z.infer<typeof pointsTransferSchema>;

// Points Balance Type (for user points summary)
export const pointsBalanceSchema = z.object({
  userId: z.string().uuid(),
  total: z.number().int(),
  availableForRedemption: z.number().int(),
  lifetimeEarned: z.number().int(),
  lifetimeSpent: z.number().int(),
  lastTransaction: z.coerce.date().nullable()
});

// Points Balance Type
export type PointsBalance = z.infer<typeof pointsBalanceSchema>;

// Daily Cap Type (for monitoring source limits)
export const dailyCapSchema = z.object({
  source: PointsSourceEnum,
  limit: z.number().int().positive(),
  current: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resetsAt: z.coerce.date()
});

// Daily Cap Type
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
  // Other values...
};
