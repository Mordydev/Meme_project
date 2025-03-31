import { z } from 'zod';
import { 
    ContentTypeEnum, 
    ContentStatusEnum, 
    mediaUrlsSchema, 
    pollOptionsSchema 
} from '../../models/entities/content.model'; // Import base content schemas/enums
import { PaginationMetaSchema } from '../points/schema'; // Re-use pagination schema

// --- Base Schemas (Already defined in content.model.ts, re-export or redefine for API clarity) ---

// Re-export or redefine base content schema parts if needed for API-specific variations
// For now, assume models/entities/content.model.ts is the source of truth

// --- Request Schemas ---

// Schema for creating content (POST /) - Reuse from model
export { createContentSchema } from '../../models/entities/content.model';

// Schema for updating content (PUT /:id) - Reuse from model
export { updateContentSchema } from '../../models/entities/content.model';

// Schema for creating a comment (POST /:id/comments) - Reuse from model
export { createCommentSchema as createCommentRequestSchema } from '../../models/entities/comment.model';

// Schema for updating a comment (PUT /comments/:commentId) - Reuse from model
export { updateCommentSchema as updateCommentRequestSchema } from '../../models/entities/comment.model';

// Schema for adding a reaction (POST /:id/reactions)
export const addReactionRequestSchema = z.object({
  reactionType: z.string().min(1), // e.g., 'like', 'celebrate', emoji unicode
});

// Schema for removing a reaction (DELETE /:id/reactions/:reactionType)
// Params are handled separately

// --- Draft Schemas ---

// Schema for the Draft entity itself (matches DB/model)
export const DraftSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    type: ContentTypeEnum,
    contentText: z.string().nullable(),
    mediaUrls: mediaUrlsSchema.nullable(),
    metadata: z.record(z.string(), z.any()).nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// Schema for creating a draft (POST /drafts)
export const CreateDraftRequestSchema = DraftSchema.omit({
    id: true,
    userId: true, // Will be taken from authenticated user
    createdAt: true,
    updatedAt: true,
}).partial({ // Most fields are optional when creating/saving
    contentText: true,
    mediaUrls: true,
    metadata: true,
}).required({
    type: true, // Type is required to know what kind of draft it is
});

// Schema for updating a draft (PUT /drafts/:draftId)
export const UpdateDraftRequestSchema = CreateDraftRequestSchema.partial(); // All fields optional on update

// Schema for draft ID parameter
export const DraftIdParamSchema = z.object({
    draftId: z.string().uuid(),
});

// Schema for publishing a draft (POST /drafts/:draftId/publish)
// Body might be empty or contain minor overrides? For now, assume empty.
export const PublishDraftRequestSchema = z.object({}); // Empty body

// --- Response Schemas ---

// Schema for a single content item response (GET /:id) - Reuse from model
export { contentResponseSchema } from '../../models/entities/content.model';

// Schema for a list of content items (GET /feed, GET /) - Reuse from model
export { contentListItemSchema } from '../../models/entities/content.model';

// Schema for a single comment item response - Reuse from model
export { commentResponseSchema } from '../../models/entities/comment.model';

// Schema for a list of comments (GET /:id/comments)
export const ListCommentsResponseSchema = z.object({
    data: z.array(commentResponseSchema), // Can be flat or threaded based on query/handler logic
    meta: z.object({ timestamp: z.string().datetime() }),
    pagination: PaginationMetaSchema.optional(), // Pagination might apply to flat lists
});

// Schema for reaction response (POST /:id/reactions)
export const ReactionResponseSchema = z.object({
    data: z.object({
        success: z.boolean(),
        reactionType: z.string(),
        action: z.enum(['added', 'removed']), // Indicate if added or removed
        newCounts: z.record(z.string(), z.number()).optional(), // Optional: return updated counts
    }),
    meta: z.object({ timestamp: z.string().datetime() }),
});

// Schema for Draft list item response (GET /drafts)
export const DraftListItemSchema = DraftSchema.pick({
    id: true,
    type: true,
    updatedAt: true,
}).extend({
    // Add a snippet or title for preview if possible
    previewText: z.string().optional(), 
});

// Schema for listing drafts (GET /drafts)
export const ListDraftsResponseSchema = z.object({
    data: z.array(DraftListItemSchema),
    meta: z.object({ timestamp: z.string().datetime() }),
    pagination: PaginationMetaSchema.optional(), // If pagination is added
});

// Schema for single draft response (GET /drafts/:draftId)
export const GetDraftResponseSchema = z.object({
    data: DraftSchema, // Return the full draft object
    meta: z.object({ timestamp: z.string().datetime() }),
});

// Schema for create/update draft response (POST /drafts, PUT /drafts/:draftId)
export const DraftMutationResponseSchema = GetDraftResponseSchema; // Return the created/updated draft

// Schema for publish draft response (POST /drafts/:draftId/publish)
// Returns the newly created content item
export const PublishDraftResponseSchema = z.object({
    data: contentResponseSchema, // Use the standard content response schema
    meta: z.object({ timestamp: z.string().datetime() }),
});

// --- Query Schemas ---

// Schema for content feed query (GET /feed, GET /)
export const FeedQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(50).default(20).optional(),
    cursor: z.string().optional(), // Assuming cursor pagination for feeds
    type: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    tags: z.string().transform(val => val.split(',')).optional(), // Comma-separated tags
    sortBy: z.enum(['latest', 'popular', 'trending']).default('latest').optional(),
    timeframe: z.enum(['day', 'week', 'month', 'all']).optional(),
});

// Schema for comments query (GET /:id/comments)
export const CommentsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
    offset: z.coerce.number().int().nonnegative().default(0).optional(),
    threaded: z.coerce.boolean().default(true).optional(),
});

// Schema for drafts query (GET /drafts)
export const DraftsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(50).default(20).optional(),
    offset: z.coerce.number().int().nonnegative().default(0).optional(),
    // Add other filters if needed (e.g., by type)
});

// --- Param Schemas ---

// Schema for content ID parameter
export const ContentIdParamSchema = z.object({
    id: z.string().uuid(),
});

// Schema for comment ID parameter
export const CommentIdParamSchema = z.object({
    commentId: z.string().uuid(),
});

// Schema for reaction type parameter
export const ReactionTypeParamSchema = z.object({
    reactionType: z.string().min(1),
});
