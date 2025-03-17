/**
 * Content-related type definitions
 */

export interface Content {
  id: string;
  userId: string;
  type: ContentType;
  contentText: string;
  mediaUrls?: string[];
  tags?: string[];
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  status: ContentStatus;
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  LINK = 'link',
  POLL = 'poll'
}

export enum ContentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  FLAGGED = 'flagged',
  PENDING = 'pending'
}

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  commentText: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  status: ContentStatus;
}

export interface Reaction {
  id: string;
  contentId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  SURPRISED = 'surprised',
  SAD = 'sad',
  ANGRY = 'angry'
}

export interface CreateContentRequest {
  type: ContentType;
  contentText: string;
  mediaUrls?: string[];
  tags?: string[];
  categoryId?: string;
}

export interface CreateCommentRequest {
  contentId: string;
  commentText: string;
  parentId?: string;
}

export interface AddReactionRequest {
  contentId: string;
  type: ReactionType;
}

export interface ContentWithEngagement extends Content {
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    level: number;
  };
  commentCount: number;
  reactionCounts: Record<ReactionType, number>;
  userReaction?: ReactionType;
  tags?: string[];
  category?: {
    id: string;
    name: string;
  };
}

export interface ContentFeedResponse {
  items: ContentWithEngagement[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ContentFeedRequest {
  categoryId?: string;
  tags?: string[];
  userId?: string;
  type?: ContentType;
  status?: ContentStatus;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'trending';
  timeFrame?: 'day' | 'week' | 'month' | 'all';
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  id: string;
  type: 'content' | 'user' | 'tag' | 'category';
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  relevanceScore: number;
  matches?: string[];
}
