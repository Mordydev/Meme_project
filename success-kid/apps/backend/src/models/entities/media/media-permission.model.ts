/**
 * Media Permission Model
 * 
 * Defines the MediaPermission entity, validation schemas, and related data transfer objects.
 * MediaPermission controls access to media files by different users and roles.
 */
import { z } from 'zod';

// Permission Type Enum
export const PermissionTypeEnum = z.enum(['read', 'write', 'delete', 'admin']);
export type PermissionType = z.infer<typeof PermissionTypeEnum>;

// Entity Type Enum
export const EntityTypeEnum = z.enum(['user', 'role', 'public']);
export type EntityType = z.infer<typeof EntityTypeEnum>;

// Media Permission Schema
export const mediaPermissionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid permission ID format' }),
  media_id: z.string().uuid({ message: 'Invalid media ID format' }),
  entity_type: EntityTypeEnum,
  entity_id: z.string().nullable().optional(),
  permission: PermissionTypeEnum,
  expires_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  created_by: z.string().uuid()
});

// Media Permission Type
export type MediaPermission = z.infer<typeof mediaPermissionSchema>;

// Create Media Permission Input Schema
export const createMediaPermissionSchema = mediaPermissionSchema
  .omit({
    id: true,
    created_at: true
  })
  .required({
    media_id: true,
    entity_type: true,
    permission: true,
    created_by: true
  })
  .refine(
    data => !(data.entity_type !== 'public' && !data.entity_id),
    {
      message: 'Entity ID is required when entity type is not public',
      path: ['entity_id']
    }
  );

// Create Media Permission DTO Type
export type CreateMediaPermissionDto = z.infer<typeof createMediaPermissionSchema>;

// Update Media Permission Input Schema
export const updateMediaPermissionSchema = mediaPermissionSchema
  .omit({
    id: true,
    media_id: true,
    entity_type: true,
    entity_id: true,
    created_at: true,
    created_by: true
  })
  .partial();

// Update Media Permission DTO Type
export type UpdateMediaPermissionDto = z.infer<typeof updateMediaPermissionSchema>;

// Temporary Access Schema
export const temporaryAccessSchema = z.object({
  token: z.string(),
  media_id: z.string().uuid(),
  expires_at: z.coerce.date(),
  created_by: z.string().uuid(),
  created_at: z.coerce.date()
});

// Temporary Access Type
export type TemporaryAccess = z.infer<typeof temporaryAccessSchema>;

// Create Temporary Access Schema
export const createTemporaryAccessSchema = z.object({
  media_id: z.string().uuid(),
  duration: z.number().int().positive(), // Duration in seconds
  created_by: z.string().uuid()
});

// Create Temporary Access DTO Type
export type CreateTemporaryAccessDto = z.infer<typeof createTemporaryAccessSchema>;
