/**
 * User Points Model
 * Represents points earned by users through platform activities
 */
import { z } from 'zod';

// Define the points source enum
export const PointsSourceEnum = z.enum([
  'content_creation',
  'comment',
  'upvote_received',
  'daily_login',
  'achievement',
  'referral',
  'profile_completion',
  'wallet_connection',
  'streak_bonus',
  'transfer_in',
  'transfer_out',
  'redemption',
  'special_event',
  'admin_adjustment'
]);
export type PointsSource = z.infer<typeof PointsSourceEnum>;

// User points schema with validation
export const userPointsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  amount: z.number().int(),
  source: PointsSourceEnum,
  reference_id: z.string().nullable(),
  created_at: z.coerce.date(),
  description: z.string().nullable()
});

// TypeScript type derived from schema
export type UserPoints = z.infer<typeof userPointsSchema>;

// Input DTOs with validation
export const createUserPointsSchema = z.object({
  user_id: z.string(),
  amount: z.number().int().refine(val => val !== 0, {
    message: "Points amount cannot be zero"
  }),
  source: PointsSourceEnum,
  reference_id: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

export type CreateUserPointsDto = z.infer<typeof createUserPointsSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const userPointsDbMapping = {
  id: 'id',
  user_id: 'user_id',
  amount: 'amount',
  source: 'source',
  reference_id: 'reference_id',
  created_at: 'created_at',
  description: 'description'
};
