/**
 * Content Model
 * 
 * Defines the Content entity, validation schemas, and related data transfer objects.
 * Content represents user-generated posts, media, and other shareable items.
 */
import { z } from 'zod';

// Content Type Enum
export const ContentTypeEnum = z.enum(['text', 'image', 'link', 'poll']);
export type ContentType = z.infer<typeof ContentTypeEnum>;

// Content Status Enum
export const ContentStatusEnum = z.enum(['active', 'deleted', 'flagged', 'pending_review']);
export type ContentStatus = z.infer<typeof ContentStatusEnum>;

// Media URL validation
export const mediaUrlSchema = z.string().url({ message: 'Media URL must be a valid URL' });
export const mediaUrlsSchema = z.array(mediaUrlSchema).default([]);

// Poll Option Schema (for poll type content)
export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(100),
  votes: z.number().int().nonnegative().default(0)
});
export type PollOption = z.infer<typeof pollOptionSchema>;

// Poll Options Schema
export const pollOptionsSchema = z.array(pollOptionSchema).min(2, { message: 'Polls must have at least 2 options' });

// Content Zod Schema
export const contentSchema = z.object({
  id: z.string().uuid({ message: 'Invalid content ID format' }),
  userId: z.string().uuid({ message: 'Invalid user ID format' }), // camelCase
  type: ContentTypeEnum,
  contentText: z.string().max(5000, { message: 'Content text cannot exceed 5000 characters' }), // camelCase
  mediaUrls: mediaUrlsSchema, // camelCase
  createdAt: z.coerce.date(), // camelCase
  updatedAt: z.coerce.date(), // camelCase
  status: ContentStatusEnum.default('active'),
  
  // Additional properties based on content type
  pollOptions: pollOptionsSchema.optional(), // camelCase
  linkUrl: z.string().url({ message: 'Link URL must be a valid URL' }).optional(), // camelCase
  linkTitle: z.string().max(200).optional(), // camelCase
  linkDescription: z.string().max(500).optional(), // camelCase
  linkImage: z.string().url().optional(), // camelCase
  
  // Metadata
  categoryId: z.string().uuid().optional(), // camelCase
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Content Type derived from Zod schema
export type Content = z.infer<typeof contentSchema>;

// Create Content Input Schema
export const createContentSchema = contentSchema
  .omit({ 
    id: true, 
    createdAt: true, // camelCase
    updatedAt: true, // camelCase
    status: true
  })
  .partial({
    mediaUrls: true, // camelCase
    pollOptions: true, // camelCase
    linkUrl: true, // camelCase
    linkTitle: true, // camelCase
    linkDescription: true, // camelCase
    linkImage: true, // camelCase
    categoryId: true, // camelCase
    tags: true,
    metadata: true
  })
  .required({
    userId: true, // camelCase
    type: true,
    contentText: true // camelCase
  })
  .refine(
    data => !(data.type === 'link' && !data.linkUrl), // camelCase
    { message: 'Link URL is required for link type content', path: ['linkUrl'] } // camelCase
  )
  .refine(
    data => !(data.type === 'poll' && !data.pollOptions), // camelCase
    { message: 'Poll options are required for poll type content', path: ['pollOptions'] } // camelCase
  )
  .refine(
    data => !(data.type === 'image' && (!data.mediaUrls || data.mediaUrls.length === 0)), // camelCase
    { message: 'Media URLs are required for image type content', path: ['mediaUrls'] } // camelCase
  );

// Create Content DTO Type
export type CreateContentDto = z.infer<typeof createContentSchema>;

// Update Content Input Schema
export const updateContentSchema = contentSchema
  .omit({ 
    id: true, 
    userId: true, // camelCase
    createdAt: true, // camelCase
    updatedAt: true, // camelCase
    type: true // Content type can't be changed after creation
  })
  .partial();

// Update Content DTO Type
export type UpdateContentDto = z.infer<typeof updateContentSchema>;

// Content Response Schema (for API responses)
export const contentResponseSchema = contentSchema
  .extend({
    // Include additional fields that are populated for responses
    author: z.object({
      id: z.string(),
      displayName: z.string(), // camelCase
      avatarUrl: z.string().nullable() // camelCase
    }).optional(),
    stats: z.object({
      likes: z.number().int().nonnegative().default(0),
      comments: z.number().int().nonnegative().default(0),
      shares: z.number().int().nonnegative().default(0)
    }).optional()
  });

// Content Response DTO Type
export type ContentResponseDto = z.infer<typeof contentResponseSchema>;

// Content List Item Schema (for content feed responses)
export const contentListItemSchema = contentSchema
  .pick({
    id: true,
    userId: true, // camelCase
    type: true,
    contentText: true, // camelCase
    mediaUrls: true, // camelCase
    createdAt: true, // camelCase
    status: true
  })
  .extend({
    author: z.object({
      id: z.string(),
      displayName: z.string(), // camelCase
      avatarUrl: z.string().nullable() // camelCase
    }),
    stats: z.object({
      likes: z.number(),
      comments: z.number(),
      shares: z.number()
    })
  });

// Content List Item Type
export type ContentListItem = z.infer<typeof contentListItemSchema>;
