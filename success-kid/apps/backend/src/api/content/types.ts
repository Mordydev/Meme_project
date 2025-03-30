/**
 * Types for the Content API module
 */
import { ContentType } from '../../models/entities/content.model'; // Assuming ContentType is exported

// Query parameters for getting content feed
export interface ContentFeedQuery {
  limit?: number;
  lastId?: string;
  lastCreatedAt?: string; // Keep as string for query, convert in handler
  type?: ContentType;
  categoryId?: string;
  userId?: string;
}

// Query parameters for getting comments
export interface CommentsQuery {
  limit?: number;
  offset?: number;
  threaded?: boolean;
  includeDeleted?: boolean;
}

// Path parameters for content ID
export interface ContentIdParam {
  id: string;
}

// Path parameters for comment ID within content
export interface CommentIdParam {
  id: string; // Content ID
  commentId: string;
}

// --- Types from feed-controller.ts ---

// Assuming FeedType is defined in the service, re-export or redefine here
export type FeedType = 'latest' | 'trending' | 'popular' | 'featured' | 'discussed' | 'personal';
export const validFeedTypes: FeedType[] = ['latest', 'trending', 'popular', 'featured', 'discussed', 'personal'];

export interface FeedQuery {
  limit?: number;
  lastId?: string;
  lastCreatedAt?: string; // Keep as string for query, convert in handler
  contentType?: string; // Consider using ContentType enum if applicable
  categoryId?: string;
  tagId?: string;
  userId?: string;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
}

// --- Body Types (Placeholder - Infer from Zod schemas) ---

// Body type for creating content (derived from Zod schema in content.model.ts)
// Assuming createContentSchema is imported or defined elsewhere
// export type CreateContentBody = z.infer<typeof createContentSchema>;

// Body type for updating content (derived from Zod schema in content.model.ts)
// Assuming updateContentSchema is imported or defined elsewhere
// export type UpdateContentBody = z.infer<typeof updateContentSchema>;

// Body type for creating comment (derived from Zod schema in comment.model.ts)
// Assuming createCommentSchema is imported or defined elsewhere
// export type CreateCommentBody = z.infer<typeof createCommentSchema>; // Might need adjustment based on handler logic

// Body type for updating comment (derived from Zod schema in comment.model.ts)
// Assuming updateCommentSchema is imported or defined elsewhere
// export type UpdateCommentBody = z.infer<typeof updateCommentSchema>;

// --- Types from search-controller.ts ---

export interface SearchQuery {
  q: string;
  limit?: number;
  offset?: number;
  contentType?: string;
  categoryId?: string;
  tagId?: string;
  userId?: string;
  dateFrom?: string; // Keep as string for query
  dateTo?: string;   // Keep as string for query
}

export interface SuggestionQuery {
  q: string;
  limit?: number;
}

// TODO: Add types from other controllers (taxonomy, moderation, analytics) if needed
