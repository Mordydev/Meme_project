/**
 * Media File Model
 * 
 * Defines the MediaFile entity, validation schemas, and related data transfer objects.
 * MediaFile represents stored media files uploaded by users.
 */
import { z } from 'zod';

// Media File Type Enum
export const MediaTypeEnum = z.enum([
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'image/avif',
  'image/svg+xml'
]);
export type MediaType = z.infer<typeof MediaTypeEnum>;

// Media File Status Enum
export const MediaStatusEnum = z.enum([
  'processing', 
  'active', 
  'failed',
  'deleted'
]);
export type MediaStatus = z.infer<typeof MediaStatusEnum>;

// Media Storage Tier Enum
export const StorageTierEnum = z.enum([
  'standard',
  'archive'
]);
export type StorageTier = z.infer<typeof StorageTierEnum>;

// Media File Dimensions
export const mediaDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive()
});
export type MediaDimensions = z.infer<typeof mediaDimensionsSchema>;

// Media Variant Schema
export const mediaVariantSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number().int().positive(),
  dimensions: mediaDimensionsSchema.optional(),
  mimeType: MediaTypeEnum
});
export type MediaVariant = z.infer<typeof mediaVariantSchema>;

// Media Metadata Schema
export const mediaMetadataSchema = z.object({
  dimensions: mediaDimensionsSchema.optional(),
  format: z.string().optional(),
  colorSpace: z.string().optional(),
  orientation: z.number().int().min(1).max(8).optional(),
  hasAlpha: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  extractedText: z.string().optional(),
  author: z.string().optional(),
  copyright: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    altitude: z.number().optional()
  }).optional(),
  // Additional custom metadata
  custom: z.record(z.string(), z.any()).optional()
});
export type MediaMetadata = z.infer<typeof mediaMetadataSchema>;

// MediaFile Schema
export const mediaFileSchema = z.object({
  id: z.string().uuid({ message: 'Invalid media file ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  original_name: z.string().max(255),
  path: z.string(),
  mimeType: MediaTypeEnum,
  size: z.number().int().positive(),
  status: MediaStatusEnum.default('processing'),
  metadata: mediaMetadataSchema.default({}),
  variants: z.record(z.string(), mediaVariantSchema).optional(),
  storage_tier: StorageTierEnum.default('standard'),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().nullable().optional()
});

// MediaFile Type
export type MediaFile = z.infer<typeof mediaFileSchema>;

// Create Media File Input Schema
export const createMediaFileSchema = mediaFileSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    variants: true
  })
  .partial({
    metadata: true,
    storage_tier: true
  })
  .required({
    user_id: true,
    original_name: true,
    path: true,
    mimeType: true,
    size: true
  });

// Create Media File DTO Type
export type CreateMediaFileDto = z.infer<typeof createMediaFileSchema>;

// Update Media File Input Schema
export const updateMediaFileSchema = mediaFileSchema
  .omit({
    id: true,
    user_id: true,
    path: true,
    created_at: true,
    updated_at: true
  })
  .partial();

// Update Media File DTO Type
export type UpdateMediaFileDto = z.infer<typeof updateMediaFileSchema>;

// Media File Response Schema
export const mediaFileResponseSchema = mediaFileSchema
  .extend({
    urls: z.object({
      original: z.string(),
      thumbnail: z.string().optional(),
      small: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional()
    }).optional()
  });

// Media File Response DTO Type
export type MediaFileResponseDto = z.infer<typeof mediaFileResponseSchema>;

// Upload File Options Schema
export const uploadOptionsSchema = z.object({
  filename: z.string().max(255),
  mimeType: MediaTypeEnum,
  userId: z.string().uuid(),
  folder: z.string().optional(),
  public: z.boolean().default(false),
  metadata: mediaMetadataSchema.optional()
});

// Upload File Options Type
export type UploadOptions = z.infer<typeof uploadOptionsSchema>;

// Validation Result Schema
export const validationResultSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional()
});

// Validation Result Type
export type ValidationResult = z.infer<typeof validationResultSchema>;
