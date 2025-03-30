import { Static } from '@sinclair/typebox';
import * as schemas from './schema';
import { Media } from '../../database/schema'; // Assuming Media type export

// We don't define a specific type for the multipart request body here,
// as Fastify handles it. The handler will extract the file part.

export type UploadMediaResponse = Static<typeof schemas.UploadMediaResponseSchema>;

// Re-exporting the DB type might be useful
export type MediaRecord = Media;
