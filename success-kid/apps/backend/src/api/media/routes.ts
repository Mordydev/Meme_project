import { FastifyInstance } from 'fastify';
import { uploadMediaHandler } from './handler';
import { UploadMediaRouteSchema } from './schema'; // Corrected import name
import { authMiddleware } from '../../middleware/auth'; // Assuming auth middleware path

export async function mediaModule(app: FastifyInstance) {
  // Apply authentication middleware to this route
  app.addHook('preHandler', authMiddleware);

  app.post(
    '/upload',
    {
      schema: UploadMediaRouteSchema,
      // Note: Body limit might need adjustment in fastify-multipart registration
      // instead of here, depending on the plugin version and setup.
      // bodyLimit: MAX_FILE_SIZE_BYTES + 1024 * 1024, // Example: Allow slightly larger payload for overhead
    },
    uploadMediaHandler
  );

  // Add other media routes here if needed (e.g., GET /media/:id, DELETE /media/:id)
}
