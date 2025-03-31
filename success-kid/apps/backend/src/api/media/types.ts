import * as schemas from './schema';
import { Media } from '../../database/schema'; // Assuming Media type export
import { z } from 'zod';

// We don't define a specific type for the multipart request body here,
// as Fastify handles it. The handler will extract the file part.

// Define the UploadMediaResponse type using Zod instead of typebox
const UploadMediaResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  blobUrl: z.string(),
  blobPath: z.string(),
  status: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type UploadMediaResponse = z.infer<typeof UploadMediaResponseSchema>;

// Re-exporting the DB type might be useful
export type MediaRecord = Media;
