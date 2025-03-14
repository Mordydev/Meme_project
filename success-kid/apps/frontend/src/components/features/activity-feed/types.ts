'use client';

/**
 * Activity Feed Types
 */

export type FeedType = 'global' | 'following' | 'personal';

export type FeedItemType = 'post' | 'media' | 'activity' | 'achievement';

export interface FeedFilters {
  types: string[];
  sort: 'recent' | 'trending' | 'top';
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  content: any; // Type-specific content
  interactions: {
    votes: number;
    comments: number;
    shares: number;
  };
  userInteractions?: {
    voted: 'up' | 'down' | null;
    saved: boolean;
    commented: boolean;
  };
}

export interface PostFeedItem extends FeedItem {
  type: 'post';
  content: {
    title: string;
    text: string;
    hasMedia: boolean;
    mediaUrls?: string[];
    preview?: string;
  };
}

export interface MediaFeedItem extends FeedItem {
  type: 'media';
  content: {
    title?: string;
    description?: string;
    mediaUrls: string[];
    mediaType: 'image' | 'video';
  };
}

export interface ActivityFeedItem extends FeedItem {
  type: 'activity';
  content: {
    activityType: 'follow' | 'comment' | 'vote' | 'milestone' | 'level_up';
    targetId?: string;
    targetType?: string;
    targetName?: string;
    detail?: string;
  };
}

export interface AchievementFeedItem extends FeedItem {
  type: 'achievement';
  content: {
    achievementId: string;
    achievementName: string;
    achievementIcon: string;
    achievementDescription?: string;
    pointsAwarded?: number;
  };
}

export interface InteractionCounts {
  votes: number;
  comments: number;
  shares: number;
}

export type UserInteractions = {
  voted: 'up' | 'down' | null;
  saved: boolean;
  commented: boolean;
};

export type InteractionType = 'vote' | 'save' | 'comment' | 'share';

export interface FeedPreferences {
  interests: string[];
  followedUsers: string[];
  contentTypes: string[];
  viewMode: 'standard' | 'compact';
}
