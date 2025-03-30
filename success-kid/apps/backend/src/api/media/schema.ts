import { Type, Static } from '@sinclair/typebox'; // Added Static

// Define a standard Error Response Schema
export const ErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Integer({ description: 'HTTP status code' }),
    code: Type.String({ description: 'Application-specific error code' }),
    message: Type.String({ description: 'Human-readable error message' }),
    details: Type.Optional(Type.Any({ description: 'Optional additional error details' })),
  },
  { $id: 'ErrorResponse', description: 'Standard error response format' }
);
export type ErrorResponse = Static<typeof ErrorResponseSchema>;


// Note: Zod/Typebox schema validation for multipart/form-data files
// is typically handled by the multipart plugin configuration (e.g., file size limits)
// and manual validation within the handler, rather than a request body schema.

// Schema for the successful response body
export const UploadMediaResponseSchema = Type.Object(
  {
    id: Type.String({ description: 'Unique ID of the uploaded media record' }),
    userId: Type.String({ description: 'ID of the user who uploaded the media' }),
    originalName: Type.String({ description: 'Original filename of the uploaded media' }),
    mimeType: Type.String({ description: 'MIME type of the uploaded media' }),
    size: Type.Integer({ description: 'Size of the media in bytes' }),
    blobUrl: Type.String({ format: 'uri', description: 'Public URL of the uploaded media in Vercel Blob' }),
    blobPath: Type.String({ description: 'Pathname of the media in Vercel Blob storage' }),
    status: Type.String({ description: 'Current status of the media record (e.g., active)' }),
    createdAt: Type.String({ format: 'date-time', description: 'Timestamp when the media record was created' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Timestamp when the media record was last updated' }),
    // metadata: Type.Optional(Type.Record(Type.String(), Type.Any())), // Optional metadata field
  },
  { $id: 'UploadMediaResponse', description: 'Response containing details of the successfully uploaded media' }
);

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
