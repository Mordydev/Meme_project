export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  postCount: number;
}

export interface CategoryMap {
  [key: string]: Category;
}

export type ContentType = 'text' | 'image' | 'link' | 'poll';

export interface Post {
  id: string;
  title: string;
  preview?: string;
  content?: string;
  type: ContentType;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  categoryId: string;
  createdAt: string;
  updatedAt?: string;
  commentCount: number;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  mediaUrls?: string[];
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  parentId?: string;
  depth: number;
  childCount: number;
}

export type CommentSort = 'top' | 'new' | 'controversial';

export type FeedType = 'latest' | 'trending' | 'following';

export interface FeedFilters {
  categoryId?: string;
  feedType: FeedType;
  timeFrame?: 'today' | 'week' | 'month' | 'all';
}

export type WarningType = 'nsfw' | 'spoiler' | 'sensitive';

export interface ReportReason {
  id: string;
  label: string;
  description: string;
  requiresDetails: boolean;
}
