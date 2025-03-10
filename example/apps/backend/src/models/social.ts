/**
 * Models for social interaction features
 */

/**
 * Reaction model
 */
export interface Reaction {
  id: string;
  userId: string;
  targetType: 'content' | 'comment';
  targetId: string;
  type: string;
  createdAt: Date;
}

/**
 * Follow relationship model
 */
export interface Follow {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}

/**
 * Interest model for user interests
 */
export interface Interest {
  id: string;
  userId: string;
  interest: string;
  source: 'user_selected' | 'system_inferred';
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feed item model
 */
export interface FeedItem {
  id: string;
  type: 'content' | 'battle' | 'achievement' | 'follow';
  priority: number;
  itemId: string;
  userId: string; // Target user (content creator, etc.)
  createdAt: Date;
}

/**
 * Feed page with pagination
 */
export interface FeedPage {
  data: FeedItem[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
}

/**
 * Feed query options
 */
export interface FeedOptions {
  cursor?: string;
  limit?: number;
  context?: string;
  bypassCache?: boolean;
}

/**
 * Comment thread result
 */
export interface CommentThreadResult {
  rootComment: any; // Root comment
  replies: any[]; // Replies with nested previews
  meta: {
    total: number;
    hasMore: boolean;
    cursor?: string;
  };
}
