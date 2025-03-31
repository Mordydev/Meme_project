/**
 * Types for the Content API module
 */
import { ContentType } from '../../models/entities/content.model'; // Assuming ContentType is exported
import { z } from 'zod';
import {
  addReactionRequestSchema as addReactionApiSchema,
  ReactionTypeParamSchema as reactionParamsSchema,
  FeedQuerySchema as contentFeedQuerySchema,
  CommentsQuerySchema as commentsQuerySchema,
  FeedQuerySchema as feedQuerySchema
  // Import other relevant schemas if needed
} from './schema';

// Define missing schemas
const searchQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).default(20).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  type: z.string().optional(),
  categoryId: z.string().uuid().optional()
});

const suggestionQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().positive().max(10).default(5).optional()
});

// --- Query Parameter Types ---

// Query parameters for getting content feed (inferred from Zod)
export type ContentFeedQuery = z.infer<typeof contentFeedQuerySchema>;

// Query parameters for getting comments (inferred from Zod)
export type CommentsQuery = z.infer<typeof commentsQuerySchema>;

// Query parameters for specific feed types (inferred from Zod)
export type FeedQuery = z.infer<typeof feedQuerySchema>;

// Query parameters for search (inferred from Zod)
export type SearchQuery = z.infer<typeof searchQuerySchema>;

// Query parameters for search suggestions (inferred from Zod)
export type SuggestionQuery = z.infer<typeof suggestionQuerySchema>;


// --- Path Parameter Types ---

// Path parameters for content ID
export interface ContentIdParam {
  id: string;
}

// Path parameters for comment ID within content
export interface CommentIdParam {
  id: string; // Content ID
  commentId: string;
}

// Path parameters for reactions
export type ReactionParams = z.infer<typeof reactionParamsSchema>;


// --- Body Types ---

// Body type for adding a reaction (inferred from Zod)
export type AddReactionBody = z.infer<typeof addReactionApiSchema>;

// Placeholder Body Types (Infer from Zod schemas in schema.ts or model files)
// These should ideally be inferred directly in handlers using Fastify's schema integration
// export type CreateContentBody = z.infer<typeof createContentApiSchema>;
// export type UpdateContentBody = z.infer<typeof updateContentApiSchema>;
// export type CreateCommentBody = z.infer<typeof createCommentApiSchema>;
// export type UpdateCommentBody = z.infer<typeof updateCommentApiSchema>;


// --- Other Types ---

// Assuming FeedType is defined elsewhere, re-export or redefine here
export type FeedType = 'latest' | 'trending' | 'popular' | 'featured' | 'discussed' | 'personal';
export const validFeedTypes: FeedType[] = ['latest', 'trending', 'popular', 'featured', 'discussed', 'personal'];


// TODO: Add types from other controllers (taxonomy, moderation, analytics) if needed
