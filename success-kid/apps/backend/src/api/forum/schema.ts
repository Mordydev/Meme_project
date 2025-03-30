/**
 * Schemas for the Forum API module
 */
import { z } from 'zod';
import {
  createThreadApiSchema, // Re-exported from types.ts
  updateThreadApiSchema, // Re-exported from types.ts
  replyContentSchema,    // Re-exported from types.ts
  threadListingQuerySchema,
  threadRepliesQuerySchema,
  userThreadsQuerySchema,
  trendingThreadsQuerySchema
} from './types'; // Import Zod schemas defined in types.ts

// --- Fastify Schemas for Routes ---

const metaProperties = {
  timestamp: { type: 'string', format: 'date-time' },
  requestId: { type: 'string' }
};

const paginationProperties = {
  limit: { type: 'integer' },
  offset: { type: 'integer' },
  nextOffset: { type: 'integer', nullable: true }
};

// Basic Forum Object Schema (adjust properties as needed)
const forumObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    // Add other relevant forum properties
  }
};

// Basic Category Object Schema (adjust properties as needed)
const categoryObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    // Add other relevant category properties
  }
};

// Basic Thread Object Schema (adjust properties as needed)
const threadObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    slug: { type: 'string' },
    user_id: { type: 'string' },
    category_id: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    // Add other relevant thread properties (views, replies_count, etc.)
  }
};

// Basic Reply Object Schema (adjust properties as needed)
const replyObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    thread_id: { type: 'string' },
    user_id: { type: 'string' },
    content_text: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    // Add other relevant reply properties
  }
};


export const getAllForumsFastifySchema = {
  tags: ['Forum'],
  summary: 'Get all forums',
  description: 'Retrieves a list of all forums.',
  response: {
    200: {
      description: 'List of forums',
      type: 'object',
      properties: {
        data: { type: 'array', items: forumObjectSchema },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const getForumBySlugFastifySchema = {
  tags: ['Forum'],
  summary: 'Get forum by slug',
  description: 'Retrieves a specific forum and its categories by slug.',
  params: {
    type: 'object',
    required: ['slug'],
    properties: { slug: { type: 'string' } }
  },
  response: {
    200: {
      description: 'Forum details',
      type: 'object',
      properties: {
        data: { // Define the expected structure including categories
            type: 'object',
            properties: {
                ...forumObjectSchema.properties,
                categories: { type: 'array', items: categoryObjectSchema }
            }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    404: { description: 'Forum not found' }
  }
};

export const getCategoryWithThreadsFastifySchema = {
  tags: ['Forum'],
  summary: 'Get category with threads',
  description: 'Retrieves a category and its threads.',
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  querystring: { $ref: 'threadListingQuerySchema#' }, // Reference Zod schema
  response: {
    200: {
      description: 'Category with threads',
      type: 'object',
      properties: {
        data: { // Define expected structure
            type: 'object',
            properties: {
                ...categoryObjectSchema.properties,
                threads: { type: 'array', items: threadObjectSchema }
            }
        },
        meta: { type: 'object', properties: metaProperties },
        pagination: { type: 'object', properties: paginationProperties }
      }
    },
    404: { description: 'Category not found' }
  }
};

export const createThreadFastifySchema = {
  tags: ['Forum'],
  summary: 'Create a new thread',
  description: 'Creates a new thread in a specified category.',
  security: [{ bearerAuth: [] }],
  body: { $ref: 'createThreadApiSchema#' }, // Reference Zod schema
  response: {
    201: {
      description: 'Thread created successfully',
      type: 'object',
      properties: {
        data: threadObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    400: { description: 'Invalid input data' },
    401: { description: 'Unauthorized' },
    404: { description: 'Category not found' }
  }
};

export const getThreadWithRepliesFastifySchema = {
  tags: ['Forum'],
  summary: 'Get thread with replies',
  description: 'Retrieves a thread and its replies.',
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  querystring: { $ref: 'threadRepliesQuerySchema#' }, // Reference Zod schema
  response: {
    200: {
      description: 'Thread with replies',
      type: 'object',
      properties: {
        data: { // Define expected structure
            type: 'object',
            properties: {
                ...threadObjectSchema.properties,
                replies: { type: 'array', items: replyObjectSchema }
            }
        },
        meta: { type: 'object', properties: metaProperties },
        pagination: { type: 'object', properties: paginationProperties }
      }
    },
    404: { description: 'Thread not found' }
  }
};

export const createThreadReplyFastifySchema = {
  tags: ['Forum'],
  summary: 'Create a reply to a thread',
  description: 'Adds a reply to a specific thread.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  body: { $ref: 'replyContentSchema#' }, // Reference Zod schema
  response: {
    201: {
      description: 'Reply created successfully',
      type: 'object',
      properties: {
        data: replyObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    400: { description: 'Invalid input data' },
    401: { description: 'Unauthorized' },
    404: { description: 'Thread not found' }
  }
};

export const updateThreadFastifySchema = {
  tags: ['Forum'],
  summary: 'Update a thread',
  description: 'Updates an existing thread.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  body: { $ref: 'updateThreadApiSchema#' }, // Reference Zod schema
  response: {
    200: {
      description: 'Thread updated successfully',
      type: 'object',
      properties: {
        data: threadObjectSchema,
        meta: { type: 'object', properties: metaProperties }
      }
    },
    400: { description: 'Invalid input data' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Thread not found' }
  }
};

export const getUserThreadsFastifySchema = {
  tags: ['Forum'],
  summary: 'Get user\'s threads',
  description: 'Retrieves threads created by a specific user.',
  security: [{ bearerAuth: [] }], // Assuming auth is needed to view any user's threads
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  querystring: { $ref: 'userThreadsQuerySchema#' }, // Reference Zod schema
  response: {
    200: {
      description: 'List of user threads',
      type: 'object',
      properties: {
        data: { type: 'array', items: threadObjectSchema },
        meta: { type: 'object', properties: metaProperties },
        pagination: { type: 'object', properties: paginationProperties }
      }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' }
  }
};

export const getTrendingThreadsFastifySchema = {
  tags: ['Forum'],
  summary: 'Get trending threads',
  description: 'Retrieves threads currently trending based on activity.',
  querystring: { $ref: 'trendingThreadsQuerySchema#' }, // Reference Zod schema
  response: {
    200: {
      description: 'List of trending threads',
      type: 'object',
      properties: {
        data: { type: 'array', items: threadObjectSchema },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};
