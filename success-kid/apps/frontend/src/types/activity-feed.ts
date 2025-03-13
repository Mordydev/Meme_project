export type FeedType = 'global' | 'following' | 'personal';
export type ContentType = 'post' | 'media' | 'activity' | 'achievement' | 'link';
export type SortOption = 'recent' | 'trending' | 'top';
export type ViewMode = 'standard' | 'compact';
export type InteractionType = 'vote' | 'comment' | 'share' | 'save';

export interface ActiveFilters {
  types: string[];
  sort: SortOption;
  viewMode?: ViewMode;
  refresh?: boolean;
}

export interface FeedFilters {
  types?: string[];
  sort?: SortOption;
  viewMode?: ViewMode;
  refresh?: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface InteractionCounts {
  votes: number;
  comments: number;
  shares: number;
}

export interface UserInteractions {
  voted: 'up' | 'down' | null;
  saved: boolean;
  commented: boolean;
}

export interface BaseFeedItem {
  id: string;
  type: ContentType;
  author: User;
  createdAt: string;
  interactions: InteractionCounts;
  userInteractions?: UserInteractions;
}

export interface PostFeedItem extends BaseFeedItem {
  type: 'post';
  title: string;
  content?: string;
  hasMedia: boolean;
}

export interface MediaFeedItem extends BaseFeedItem {
  type: 'media';
  title?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'gif';
  aspectRatio?: number;
  caption?: string;
}

export interface LinkFeedItem extends BaseFeedItem {
  type: 'link';
  title: string;
  url: string;
  previewImage?: string;
  description?: string;
  domain: string;
}

export interface ActivityFeedItem extends BaseFeedItem {
  type: 'activity';
  activityType: 'post_created' | 'comment_added' | 'followed_user' | 'joined_community';
  targetId?: string;
  targetType?: string;
  targetTitle?: string;
}

export interface AchievementFeedItem extends BaseFeedItem {
  type: 'achievement';
  achievementId: string;
  achievementName: string;
  achievementIcon: string;
  achievementDescription?: string;
  pointsAwarded?: number;
}

export type FeedItem =
  | PostFeedItem
  | MediaFeedItem
  | LinkFeedItem
  | ActivityFeedItem
  | AchievementFeedItem;

export interface FeedPreferences {
  interests: string[];
  followedUsers: string[];
  contentTypes: string[];
  viewMode: ViewMode;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface InteractionResponse {
  success: boolean;
  itemId: string;
  updatedCounts: InteractionCounts;
  pointsAwarded?: number;
}
