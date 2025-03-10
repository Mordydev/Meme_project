import { FastifyRequest, FastifyReply } from 'fastify';

interface GenerateUploadUrlBody {
  fileType: string;
  contentType: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Handler for generating a signed URL for direct media uploads
 */
export async function generateUploadUrlHandler(
  request: FastifyRequest<{
    Body: GenerateUploadUrlBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { fileType, contentType, isPublic, metadata } = request.body;
    
    // Get authenticated user ID
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to upload media',
        },
      });
    }
    
    // Validate file type and content type
    if (!fileType || !contentType) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File type and content type are required',
        },
      });
    }
    
    // Get media service
    const mediaService = request.diScope.resolve('mediaService');
    
    // Generate upload URL
    const result = await mediaService.generateUploadUrl(
      userId,
      fileType,
      contentType,
      {
        isPublic,
        metadata
      }
    );
    
    return reply.code(200).send({
      data: result
    });
  } catch (error) {
    request.log.error(error, 'Error generating upload URL');
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details || [],
        },
      });
    }
    
    // Handle other errors
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while generating upload URL',
      },
    });
  }
}
