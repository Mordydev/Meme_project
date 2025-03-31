import { z } from 'zod';

// Define a standard Error Response Schema
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int().describe('HTTP status code'),
  code: z.string().describe('Application-specific error code'),
  message: z.string().describe('Human-readable error message'),
  details: z.any().optional().describe('Optional additional error details')
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Schema for the successful response body
export const UploadMediaResponseSchema = z.object({
  id: z.string().describe('Unique ID of the uploaded media record'),
  userId: z.string().describe('ID of the user who uploaded the media'),
  originalName: z.string().describe('Original filename of the uploaded media'),
  mimeType: z.string().describe('MIME type of the uploaded media'),
  size: z.number().int().describe('Size of the media in bytes'),
  blobUrl: z.string().url().describe('Public URL of the uploaded media in Vercel Blob'),
  blobPath: z.string().describe('Pathname of the media in Vercel Blob storage'),
  status: z.string().describe('Current status of the media record (e.g., active)'),
  createdAt: z.string().or(z.date()).describe('Timestamp when the media record was created'),
  updatedAt: z.string().or(z.date()).describe('Timestamp when the media record was last updated')
});

// Define the overall route schema for Fastify
export const UploadMediaRouteSchema = {
  summary: 'Upload Media File',
  description: 'Uploads an image file (jpeg, png, gif, webp, < 5MB) to Vercel Blob storage and returns its metadata.',
  tags: ['media'],
  security: [{ bearerAuth: [] }], // Requires authentication
  // No request body schema here because it's multipart/form-data
  response: {
    201: UploadMediaResponseSchema, // Use 201 Created for successful uploads
    400: ErrorResponseSchema, // Validation errors (file type, size)
    401: ErrorResponseSchema, // Unauthorized
    413: ErrorResponseSchema, // Payload Too Large (if handled by multipart plugin)
    500: ErrorResponseSchema, // Internal server errors
  },
};
