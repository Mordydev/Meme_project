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
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  type: ContentTypeEnum,
  content_text: z.string().max(5000, { message: 'Content text cannot exceed 5000 characters' }),
  media_urls: mediaUrlsSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  status: ContentStatusEnum.default('active'),
  
  // Additional properties based on content type
  poll_options: pollOptionsSchema.optional(),
  link_url: z.string().url({ message: 'Link URL must be a valid URL' }).optional(),
  link_title: z.string().max(200).optional(),
  link_description: z.string().max(500).optional(),
  link_image: z.string().url().optional(),
  
  // Metadata
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Content Type derived from Zod schema
export type Content = z.infer<typeof contentSchema>;

// Create Content Input Schema
export const createContentSchema = contentSchema
  .omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    status: true
  })
  .partial({
    media_urls: true,
    poll_options: true,
    link_url: true,
    link_title: true,
    link_description: true,
    link_image: true,
    category_id: true,
    tags: true,
    metadata: true
  })
  .required({
    user_id: true,
    type: true,
    content_text: true
  })
  .refine(
    data => !(data.type === 'link' && !data.link_url),
    { message: 'Link URL is required for link type content', path: ['link_url'] }
  )
  .refine(
    data => !(data.type === 'poll' && !data.poll_options),
    { message: 'Poll options are required for poll type content', path: ['poll_options'] }
  )
  .refine(
    data => !(data.type === 'image' && (!data.media_urls || data.media_urls.length === 0)),
    { message: 'Media URLs are required for image type content', path: ['media_urls'] }
  );

// Create Content DTO Type
export type CreateContentDto = z.infer<typeof createContentSchema>;

// Update Content Input Schema
export const updateContentSchema = contentSchema
  .omit({ 
    id: true, 
    user_id: true, 
    created_at: true, 
    updated_at: true,
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
      display_name: z.string(),
      avatar_url: z.string().nullable()
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
    user_id: true,
    type: true,
    content_text: true,
    media_urls: true,
    created_at: true,
    status: true
  })
  .extend({
    author: z.object({
      id: z.string(),
      display_name: z.string(),
      avatar_url: z.string().nullable()
    }),
    stats: z.object({
      likes: z.number(),
      comments: z.number(),
      shares: z.number()
    })
  });

// Content List Item Type
export type ContentListItem = z.infer<typeof contentListItemSchema>;
