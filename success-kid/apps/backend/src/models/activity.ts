/**
 * Activity Feed Models
 * Defines the data structures for the activity feed system.
 */

/**
 * Activity types
 */
export enum ActivityType {
  // Content-related activities
  CONTENT_CREATED = 'content_created',
  CONTENT_COMMENTED = 'content_commented',
  CONTENT_REACTED = 'content_reacted',
  
  // Achievement-related activities
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  
  // Point-related activities
  POINTS_EARNED = 'points_earned',
  POINTS_REDEEMED = 'points_redeemed',
  
  // Social activities
  USER_FOLLOWED = 'user_followed',
  USER_MENTIONED = 'user_mentioned',
  
  // System activities
  MILESTONE_REACHED = 'milestone_reached',
  WALLET_CONNECTED = 'wallet_connected',
  BADGE_AWARDED = 'badge_awarded',
  REFERRAL_SUCCESSFUL = 'referral_successful'
}

/**
 * Activity visibility settings
 */
export enum ActivityVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private'
}

/**
 * Activity event interface
 */
export interface ActivityEvent {
  id: string;
  actorId: string;  // User who performed the action
  objectType: string; // Type of object acted upon (e.g., 'content', 'achievement')
  objectId: string;   // ID of the object acted upon
  targetType?: string; // Optional target type (e.g., 'user' for mentions)
  targetId?: string;   // Optional target ID
  action: string;     // The action performed (e.g., 'created', 'commented')
  data?: Record<string, any>; // Additional context data
  visibility: ActivityVisibility;
  createdAt: Date;
}

/**
 * Interface for creating a new activity event
 */
export interface CreateActivityEventDto {
  actorId: string;
  objectType: string;
  objectId: string;
  targetType?: string;
  targetId?: string;
  action: string;
  data?: Record<string, any>;
  visibility?: ActivityVisibility;
}

/**
 * User feed item interface
 */
export interface UserFeedItem {
  userId: string;
  activityId: string;
  addedAt: Date;
  read: boolean;
  hidden: boolean;
}

/**
 * Feed item with activity details
 */
export interface FeedItem extends ActivityEvent {
  // Additional fields when presented in a feed
  actor?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    level?: number;
  };
  object?: Record<string, any>; // Object details (e.g., content snippet)
  target?: Record<string, any>; // Target details if applicable
  read?: boolean;
  hidden?: boolean;
}

/**
 * Options for fetching feed items
 */
export interface FeedOptions {
  limit?: number;
  before?: string; // Cursor for pagination (activityId)
  after?: string;  // Cursor for pagination (activityId)
  includeTypes?: ActivityType[];
  excludeTypes?: ActivityType[];
  actorIds?: string[];
  unreadOnly?: boolean;
}

/**
 * Result for paginated feed queries
 */
export interface FeedResult {
  items: FeedItem[];
  hasMore: boolean;
  nextCursor?: string;
  unreadCount: number;
}

/**
 * Activity aggregation
 */
export interface AggregatedActivity {
  type: string;
  count: number;
  actors: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  }>;
  objectType: string;
  objectId: string;
  primaryActivity: ActivityEvent;
  activities: ActivityEvent[];
  createdAt: Date;
}
