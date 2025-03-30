import { FastifyRequest, FastifyReply } from 'fastify';
import { mediaService, FileData } from '../../services/media/media-service';
import { AppError } from '../../lib/errors'; // Assuming AppError is correctly located now
import { logger } from '../../lib/logger';
import { UploadMediaResponse } from './types'; // Corrected import name if needed
import { UploadMediaResponseSchema } from './schema'; // Corrected import name

// Define the expected structure of a multipart file part from fastify-multipart
interface MultipartFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  file: NodeJS.ReadableStream; // The file stream
  fields: { [key: string]: any }; // Other form fields
  toBuffer: () => Promise<Buffer>; // Method to get the buffer
  // Potentially other properties depending on the plugin version
}

export async function uploadMediaHandler(
  request: FastifyRequest, // No specific body type needed for multipart
  reply: FastifyReply
): Promise<UploadMediaResponse> {
  // Ensure authentication middleware has run and added user info
  if (!request.user?.id) {
    logger.warn('Attempted media upload without authentication');
    reply.code(401);
    throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
  }
  const userId = request.user.id;

  // Process the multipart file
  // Note: fastify-multipart typically attaches the file data to request.file() or request.files()
  // Adjust this based on how the plugin is registered in app.ts
  const data = await request.file(); // Or request.files() if multiple uploads allowed

  if (!data) {
    logger.warn({ userId }, 'Media upload request received without file data');
    reply.code(400);
    throw new AppError('No file uploaded.', 'VALIDATION_ERROR', 400);
  }

  // Cast to expected type (adjust based on actual plugin behavior)
  const filePart = data as unknown as MultipartFile;

  // Get the file buffer
  const buffer = await filePart.toBuffer();
  const size = buffer.length; // Get size from buffer

  logger.info({ userId, filename: filePart.originalname, mimetype: filePart.mimetype, size }, 'Received file for upload');

  const fileData: FileData = {
    buffer: buffer,
    mimetype: filePart.mimetype,
    filename: filePart.originalname,
    size: size,
  };

  try {
    const mediaRecord = await mediaService.uploadMedia(fileData, userId);

    // Format the response according to the schema
    const response: UploadMediaResponse = {
      id: mediaRecord.id,
      userId: mediaRecord.userId,
      originalName: mediaRecord.originalName,
      mimeType: mediaRecord.mimeType,
      size: mediaRecord.size,
      blobUrl: mediaRecord.blobUrl,
      blobPath: mediaRecord.blobPath,
      status: mediaRecord.status,
      createdAt: mediaRecord.createdAt.toISOString(), // Convert Date to ISO string
      updatedAt: mediaRecord.updatedAt.toISOString(), // Convert Date to ISO string
    };

    reply.code(201); // 201 Created
    return response;

  } catch (error) {
    // Handle errors thrown by the service (e.g., validation, upload failure)
    if (error instanceof AppError) {
      logger.warn({ userId, code: error.code, message: error.message, details: error.details }, 'AppError during media upload');
      reply.code(error.statusCode);
      throw error; // Re-throw the original AppError
    } else {
      logger.error({ userId, error }, 'Unexpected error during media upload');
      reply.code(500);
      throw new AppError('An unexpected error occurred during media upload.', 'SERVER_ERROR', 500);
    }
  }
}
