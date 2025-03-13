/**
 * Types for Community Forums and Discussion System
 */

// Category System
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  postCount: number;
}

export type CategoryMap = Record<string, Category>;

export type CommentSort = 'top' | 'new' | 'controversial';

export type ContentType = 'text' | 'image' | 'link' | 'poll';

export type ContentFeedType = 'latest' | 'trending' | 'following';

export type WarningType = 'sensitive' | 'spoiler' | 'nsfw';

// Post/Content Data
export interface Post {
  id: string;
  title: string;
  content: string;
  preview?: string;
  type: ContentType;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    displayName?: string;
    role?: string;
  };
  categoryId: string;
  createdAt: string;
  updatedAt?: string;
  commentCount: number;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  mediaUrls?: string[];
  tags?: string[];
}

// Comment Data
export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    displayName?: string;
  };
  createdAt: string;
  updatedAt?: string;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  parentId?: string;
  depth: number;
  childCount: number;
}

// Report Data
export interface Report {
  contentId: string;
  contentType: 'post' | 'comment';
  reason: string;
  details?: string;
}

// Form Data
export interface ContentFormData {
  title: string;
  content: string;
  type: ContentType;
  categoryId: string;
  mediaUrls?: string[];
  tags?: string[];
}

export interface CommentFormData {
  content: string;
  parentId?: string;
}

// API Responses
export interface CategoriesResponse {
  categories: Category[];
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PostResponse {
  post: Post;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface VoteResponse {
  voteCount: number;
  userVote: 'up' | 'down' | null;
  pointsAwarded?: number;
}

export interface ReportResponse {
  success: boolean;
  reportId: string;
}
