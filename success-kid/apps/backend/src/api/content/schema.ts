/**
 * Schemas for the Content API module (Content and Comments)
 */
import { z } from 'zod';
import {
  createContentSchema as createContentModelSchema,
  updateContentSchema as updateContentModelSchema,
  ContentType
} from '../../models/entities/content.model';
import {
  createCommentSchema as createCommentModelSchema,
  updateCommentSchema as updateCommentModelSchema
} from '../../models/entities/comment.model';

// --- Zod Schemas for Validation ---

export const contentFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  lastId: z.string().optional(),
  lastCreatedAt: z.string().datetime({ message: "Invalid date format for lastCreatedAt" }).optional(),
  // Use z.enum with expected string values since ContentType is likely a type alias
  type: z.enum(['text', 'image', 'link', 'poll']).optional(),
  categoryId: z.string().optional(), // Consider UUID validation if applicable
  userId: z.string().optional(), // Consider UUID validation if applicable
  tags: z.array(z.string()).optional(), // Add tags array
  sortBy: z.enum(['latest', 'popular', 'trending']).optional() // Add sortBy
});

export const commentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  threaded: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()).default(true),
  includeDeleted: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()).default(false)
});

// Re-export model schemas if needed for direct use, or create specific API schemas
export const createContentApiSchema = createContentModelSchema;
export const updateContentApiSchema = updateContentModelSchema;
// Adjust comment schemas if API differs slightly from model (e.g., omitting fields)
export const createCommentApiSchema = createCommentModelSchema.omit({ content_id: true, user_id: true });
export const updateCommentApiSchema = updateCommentModelSchema;

// Reaction Schemas
export const reactionTypeSchema = z.enum(['like', 'love', 'celebrate', 'insightful', 'funny']); // Use enum based on ReactionService

export const addReactionApiSchema = z.object({
  reactionType: reactionTypeSchema
});

export const reactionParamsSchema = z.object({
  contentId: z.string().uuid(),
  reactionType: reactionTypeSchema
});


// --- Fastify Schemas for Routes ---

const metaProperties = {
  timestamp: { type: 'string', format: 'date-time' },
  requestId: { type: 'string' }
};

const paginationProperties = {
  limit: { type: 'integer' },
  // Add other pagination fields as needed (offset, hasMore, lastId, etc.)
};

// Basic Content Object Schema (adjust properties as needed)
const contentObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    user_id: { type: 'string' },
    type: { type: 'string' },
    content_text: { type: 'string', nullable: true },
    media_urls: { type: 'array', items: { type: 'string' }, nullable: true },
    created_at: { type: 'string', format: 'date-time' },
    // Add other relevant content properties
  }
};

// Basic Comment Object Schema (adjust properties as needed)
const commentObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    content_id: { type: 'string' },
    user_id: { type: 'string' },
    parent_comment_id: { type: 'string', nullable: true },
    comment_text: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    // Add other relevant comment properties
  }
};

export const getContentFeedFastifySchema = {
  tags: ['Content'],
  summary: 'Get content feed',
  description: 'Retrieves a feed of content items based on filters.',
  // security: [{ bearerAuth: [] }], // Optional auth
  querystring: { $ref: 'contentFeedQuerySchema#' }, // Reference Zod schema (requires setup) or define inline
  response: {
    200: {
      description: 'Content feed',
      type: 'object',
      properties: {
        data: { type: 'array', items: contentObjectSchema },
        meta: { type: 'object', properties: metaProperties },
        pagination: { type: 'object', properties: { /* Define pagination response */ } }
      }
    }
  }
};

export const getContentByIdFastifySchema = {
  tags: ['Content'],
  summary: 'Get content by ID',
  description: 'Retrieves a specific content item by its ID.',
  // security: [{ bearerAuth: [] }], // Optional auth
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  response: {
    200: {
      description: 'Content item details',
      type: 'object',
      properties: {
        data: contentObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    404: { description: 'Content not found' }
  }
};

export const createContentFastifySchema = {
  tags: ['Content'],
  summary: 'Create new content',
  description: 'Creates a new content item.',
  security: [{ bearerAuth: [] }], // Required auth
  body: { $ref: 'createContentApiSchema#' }, // Reference Zod schema or define inline
  response: {
    201: {
      description: 'Content created successfully',
      type: 'object',
      properties: {
        data: contentObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const updateContentFastifySchema = {
  tags: ['Content'],
  summary: 'Update content',
  description: 'Updates an existing content item.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  body: { $ref: 'updateContentApiSchema#' }, // Reference Zod schema or define inline
  response: {
    200: {
      description: 'Content updated successfully',
      type: 'object',
      properties: {
        data: contentObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Content not found' }
  }
};

export const deleteContentFastifySchema = {
  tags: ['Content'],
  summary: 'Delete content',
  description: 'Deletes a content item.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  response: {
    200: {
      description: 'Content deleted successfully',
      type: 'object',
      properties: {
        data: { type: 'object', properties: { success: { type: 'boolean' } } },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Content not found' }
  }
};

export const getContentCommentsFastifySchema = {
  tags: ['Comments'],
  summary: 'Get content comments',
  description: 'Retrieves comments for a specific content item.',
  // security: [{ bearerAuth: [] }], // Optional auth
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  querystring: { $ref: 'commentsQuerySchema#' }, // Reference Zod schema or define inline
  response: {
    200: {
      description: 'List of comments',
      type: 'object',
      properties: {
        data: { type: 'array', items: commentObjectSchema },
        meta: { type: 'object', properties: metaProperties },
        pagination: { type: 'object', properties: { /* Define pagination response */ } }
      }
    },
    404: { description: 'Content not found' }
  }
};

export const createCommentFastifySchema = {
  tags: ['Comments'],
  summary: 'Create comment',
  description: 'Adds a comment to a content item.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  body: { $ref: 'createCommentApiSchema#' }, // Reference Zod schema or define inline
  response: {
    201: {
      description: 'Comment created successfully',
      type: 'object',
      properties: {
        data: commentObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    404: { description: 'Content not found' }
  }
};

export const updateCommentFastifySchema = {
  tags: ['Comments'],
  summary: 'Update comment',
  description: 'Updates an existing comment.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id', 'commentId'],
    properties: {
      id: { type: 'string' },
      commentId: { type: 'string' }
    }
  },
  body: { $ref: 'updateCommentApiSchema#' }, // Reference Zod schema or define inline
  response: {
    200: {
      description: 'Comment updated successfully',
      type: 'object',
      properties: {
        data: commentObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Comment not found' }
  }
};

export const deleteCommentFastifySchema = {
  tags: ['Comments'],
  summary: 'Delete comment',
  description: 'Deletes a comment.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id', 'commentId'],
    properties: {
      id: { type: 'string' },
      commentId: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'Comment deleted successfully',
      type: 'object',
      properties: {
        data: { type: 'object', properties: { success: { type: 'boolean' } } },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Comment not found' }
  }
};

// --- Zod Schema from feed-controller.ts ---

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  lastId: z.string().optional(),
  lastCreatedAt: z.string().datetime({ message: "Invalid date format for lastCreatedAt" }).optional(),
  contentType: z.string().optional(), // Consider ContentType enum
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  userId: z.string().optional(),
  timeframe: z.enum(['day', 'week', 'month', 'all']).default('week'), // Removed 'year' to match FeedType
  sortBy: z.enum(['latest', 'popular', 'trending']).optional() // Add sortBy
});

// --- Fastify Schema from feed-controller.ts ---

export const getFeedFastifySchema = {
  tags: ['Feed'], // Changed tag
  summary: 'Get feed by type',
  description: 'Retrieves a specific type of content feed.',
  // security: [{ bearerAuth: [] }], // Optional auth
  params: {
    type: 'object',
    required: ['type'],
    properties: {
      type: { type: 'string' } // Consider enum: ['latest', 'trending', 'popular', 'featured', 'discussed', 'personal']
    }
  },
  querystring: { $ref: 'feedQuerySchema#' }, // Reference Zod schema or define inline
  response: {
    200: {
      description: 'Content feed',
      type: 'object',
      properties: {
        data: { type: 'array', items: contentObjectSchema }, // Use existing content schema
        meta: {
          type: 'object',
          properties: {
            ...metaProperties, // Reuse meta properties
            feedType: { type: 'string' }
          }
        },
        pagination: { type: 'object', properties: { /* Define pagination response */ } }
      }
    },
    400: { description: 'Invalid feed type' },
    401: { description: 'Unauthorized for personal feed' }
  }
};

// --- Zod Schemas from search-controller.ts ---

export const searchQuerySchema = z.object({
  q: z.string().min(1, { message: "Search query must be at least 1 character" }).max(100, { message: "Search query cannot exceed 100 characters" }),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  contentType: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime({ message: "Invalid date format for dateFrom" }).optional(),
  dateTo: z.string().datetime({ message: "Invalid date format for dateTo" }).optional()
});

export const suggestionQuerySchema = z.object({
  q: z.string().min(1, { message: "Suggestion query must be at least 1 character" }).max(100, { message: "Suggestion query cannot exceed 100 characters" }),
  limit: z.coerce.number().int().min(1).max(10).default(5)
});


// --- Fastify Schemas from search-controller.ts ---

export const searchContentFastifySchema = {
  tags: ['Search'],
  summary: 'Search content',
  description: 'Performs a search across content items.',
  // security: [{ bearerAuth: [] }], // Optional auth
  querystring: { $ref: 'searchQuerySchema#' }, // Reference Zod schema or define inline
  response: {
    200: {
      description: 'Search results',
      type: 'object',
      properties: {
        data: { type: 'array', items: contentObjectSchema }, // Reuse content schema
        meta: {
          type: 'object',
          properties: {
            ...metaProperties,
            query: { type: 'string' },
            totalResults: { type: 'integer' },
            filters: { type: 'object' } // Define filter options structure if needed
          }
        },
        pagination: { type: 'object', properties: { /* Define pagination response */ } }
      }
    }
  }
};

export const getSearchSuggestionsFastifySchema = {
  tags: ['Search'],
  summary: 'Get search suggestions',
  description: 'Retrieves type-ahead search suggestions.',
  querystring: { $ref: 'suggestionQuerySchema#' }, // Reference Zod schema or define inline
  response: {
    200: {
      description: 'Search suggestions',
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'string' } }, // Assuming suggestions are strings
        meta: {
          type: 'object',
          properties: {
            ...metaProperties,
            query: { type: 'string' }
          }
        }
      }
    }
  }
};

// --- Reaction Fastify Schemas ---

export const addReactionFastifySchema = {
  tags: ['Reactions'],
  summary: 'Add reaction to content',
  description: 'Adds a reaction to a specific content item.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } } // Content ID
  },
  body: { $ref: 'addReactionApiSchema#' }, // Reference Zod schema
  response: {
    201: {
      description: 'Reaction added successfully',
      type: 'object',
      properties: {
        data: { type: 'object', properties: { success: { type: 'boolean' } } }, // Simple success response
        meta: { type: 'object', properties: metaProperties }
      }
    },
    200: { // Handle case where reaction already exists
        description: 'Reaction already exists',
        type: 'object',
        properties: {
            data: { type: 'object', properties: { success: { type: 'boolean', default: true }, message: { type: 'string' } } },
            meta: { type: 'object', properties: metaProperties }
        }
    },
    404: { description: 'Content not found' }
  }
};

export const removeReactionFastifySchema = {
  tags: ['Reactions'],
  summary: 'Remove reaction from content',
  description: 'Removes a specific reaction from a content item.',
  security: [{ bearerAuth: [] }], // Required auth
  params: {
    type: 'object',
    required: ['id', 'reactionType'],
    properties: {
      id: { type: 'string' }, // Content ID
      reactionType: { type: 'string' } // Reaction Type
    }
  },
  response: {
    200: {
      description: 'Reaction removed successfully',
      type: 'object',
      properties: {
        data: { type: 'object', properties: { success: { type: 'boolean' } } },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    404: { description: 'Content or Reaction not found' }
  }
};


// TODO: Add schemas from other controllers (taxonomy, moderation, analytics)
