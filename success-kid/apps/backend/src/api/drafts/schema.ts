/**
 * Schemas for Draft API
 */
import { z } from 'zod';

// Base schema for draft content
const DraftBaseSchema = z.object({
  type: z.string().min(1).max(50),
  contentText: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for creating a draft
export const CreateDraftSchema = DraftBaseSchema;

// Schema for updating a draft
export const UpdateDraftSchema = z.object({
  contentText: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for URL parameters
export const DraftParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid draft ID format' }),
});

// Schema for query parameters
export const DraftQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Schema for a tag
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  color: z.string().optional(),
});

// Schema for a draft response
export const DraftResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  contentText: z.string().nullable(),
  mediaUrls: z.array(z.string()).nullable(),
  metadata: z.record(z.any()),
  lastSaved: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(TagSchema).optional(),
});

// Schema for draft response (wrapper)
export const DraftResponseWrapperSchema = z.object({
  data: DraftResponseSchema,
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
});

// Schema for drafts response (multiple drafts)
export const DraftsResponseSchema = z.object({
  data: z.array(DraftResponseSchema),
  meta: z.object({
    timestamp: z.string().datetime(),
    total: z.number().int().optional(),
  }),
  pagination: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
  }).optional(),
});

// Schema for delete draft response
export const DeleteDraftResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
});

// Schema for publish draft response
export const PublishDraftResponseSchema = z.object({
  data: z.object({
    contentId: z.string(),
    // Other potential content fields
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
});

// Schema for error response
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
});
