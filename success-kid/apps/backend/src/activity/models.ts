/**
 * Activity Models
 * 
 * Defines the data structures for activity events and feeds.
 */
import { z } from 'zod';

/**
 * Activity visibility levels
 */
export enum ActivityVisibility {
  PUBLIC = 'public',      // Visible to all users
  FOLLOWERS = 'followers', // Visible to followers
  PRIVATE = 'private',    // Visible only to the actor
}

/**
 * Activity types
 */
export enum ActivityType {
  // Content activities
  CONTENT_CREATED = 'content.created',
  CONTENT_COMMENTED = 'content.commented',
  CONTENT_REACTION = 'content.reaction',
  
  // Points activities
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  
  // Achievement activities
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  LEVEL_UP = 'user.levelUp',
  
  // Wallet activities
  WALLET_CONNECTED = 'wallet.connected',
  TOKEN_RECEIVED = 'token.received',
  TOKEN_SENT = 'token.sent',
  
  // Community activities
  USER_JOINED = 'user.joined',
  USER_FOLLOWED = 'user.followed',
  MILESTONE_REACHED = 'milestone.reached',
  
  // Referral activities
  REFERRAL_CREATED = 'referral.created',
  REFERRAL_COMPLETED = 'referral.completed',
}

/**
 * Activity event schema
 */
export const activityEventSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ActivityType),
  actorId: z.string(),
  targetId: z.string().optional(),
  objectId: z.string().optional(),
  data: z.record(z.any()).default({}),
  visibility: z.nativeEnum(ActivityVisibility).default(ActivityVisibility.PUBLIC),
  createdAt: z.date(),
});

/**
 * Activity event type
 */
export type ActivityEvent = z.infer<typeof activityEventSchema>;

/**
 * Create activity event DTO schema
 */
export const createActivityEventDtoSchema = z.object({
  type: z.nativeEnum(ActivityType),
  actorId: z.string(),
  targetId: z.string().optional(),
  objectId: z.string().optional(),
  data: z.record(z.any()).default({}),
  visibility: z.nativeEnum(ActivityVisibility).default(ActivityVisibility.PUBLIC),
});

/**
 * Create activity event DTO type
 */
export type CreateActivityEventDto = z.infer<typeof createActivityEventDtoSchema>;

/**
 * Activity feed item schema
 */
export const feedItemSchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  userId: z.string(),
  type: z.nativeEnum(ActivityType),
  actorId: z.string(),
  data: z.record(z.any()).default({}),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
});

/**
 * Activity feed item type
 */
export type FeedItem = z.infer<typeof feedItemSchema>;

/**
 * Feed options schema
 */
export const feedOptionsSchema = z.object({
  limit: z.number().default(20),
  before: z.string().optional(),
  after: z.string().optional(),
  types: z.array(z.nativeEnum(ActivityType)).optional(),
  actors: z.array(z.string()).optional(),
});

/**
 * Feed options type
 */
export type FeedOptions = z.infer<typeof feedOptionsSchema>;

/**
 * Aggregated activity schema
 */
export const aggregatedActivitySchema = z.object({
  primaryActivity: z.instanceof(Object),
  actorId: z.string(),
  actorName: z.string(),
  actorAvatar: z.string().optional(),
  type: z.nativeEnum(ActivityType),
  count: z.number().default(1),
  relatedActivities: z.array(z.instanceof(Object)).default([]),
  createdAt: z.date(),
});

/**
 * Aggregated activity type
 */
export type AggregatedActivity = z.infer<typeof aggregatedActivitySchema>;
