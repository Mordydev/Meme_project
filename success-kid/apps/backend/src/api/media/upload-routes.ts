/**
 * Upload Routes
 * 
 * API endpoints for file uploads and upload management.
 */
import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { uploadService } from '../../services/media/upload/service';
import { MediaTypeEnum } from '../../models/entities/media';

/**
 * Types for request parameters
 */
interface UploadUrlRequest {
  Body: {
    filename: string;
    mimeType: string;
    size: number;
  };
}

interface CompleteUploadRequest {
  Params: {
    uploadId: string;
  };
}

interface UploadStatusRequest {
  Params: {
    uploadId: string;
  };
}

interface CancelUploadRequest {
  Params: {
    uploadId: string;
  };
}

/**
 * Upload routes plugin
 */
export const uploadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register JSON body parser with limit for metadata
  fastify.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
      files: 1 // Allow only one file at a time
    }
  });
  
  // Get presigned URL for direct upload
  fastify.post<UploadUrlRequest>('/presigned-url', {
    schema: {
      description: 'Get a presigned URL for direct file upload',
      tags: ['media', 'upload'],
      body: {
        type: 'object',
        required: ['filename', 'mimeType', 'size'],
        properties: {
          filename: { type: 'string' },
          mimeType: { 
            type: 'string', 
            enum: Object.values(MediaTypeEnum.enum)
          },
          size: { 
            type: 'number',
            minimum: 1,
            maximum: 100 * 1024 * 1024 // 100MB
          }
        }
      },
      response: {
        200: {
          description: 'Success response with presigned URL',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                expires: { type: 'number' },
                fields: { 
                  type: 'object',
                  additionalProperties: true
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate], // Require authentication
    handler: async (request, reply) => {
      try {
        const { filename, mimeType, size } = request.body;
        const userId = request.user.id;
        
        const presignedUrl = await uploadService.getUploadUrl(userId, {
          filename,
          mimeType,
          size
        });
        
        return reply.send({
          data: presignedUrl,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        request.log.error('Error generating presigned URL', { error });
        throw error;
      }
    }
  });
  
  // Handle direct file uploads
  fastify.post('/upload', {
    schema: {
      description: 'Upload a file directly',
      tags: ['media', 'upload'],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          description: 'Success response with media file details',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                original_name: { type: 'string' },
                mimeType: { type: 'string' },
                size: { type: 'number' },
                status: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate], // Require authentication
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const data = await request.file();
        
        if (!data) {
          return reply.code(400).send({
            data: null,
            meta: {
              timestamp: new Date().toISOString(),
              requestId: request.id
            },
            errors: [{
              code: 'MISSING_FILE',
              message: 'No file uploaded'
            }]
          });
        }
        
        // Get file buffer
        const buffer = await data.toBuffer();
        
        // Process upload
        const mediaFile = await uploadService.handleUpload(buffer, {
          userId,
          filename: data.filename,
          mimeType: data.mimetype as any, // Type assertion
          public: false
        });
        
        return reply.send({
          data: {
            id: mediaFile.id,
            original_name: mediaFile.original_name,
            mimeType: mediaFile.mimeType,
            size: mediaFile.size,
            status: mediaFile.status
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        request.log.error('Error uploading file', { error });
        throw error;
      }
    }
  });
  
  // Complete a direct upload
  fastify.post<CompleteUploadRequest>('/upload/:uploadId/complete', {
    schema: {
      description: 'Complete a direct upload',
      tags: ['media', 'upload'],
      params: {
        type: 'object',
        required: ['uploadId'],
        properties: {
          uploadId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Success response with media file details',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                original_name: { type: 'string' },
                mimeType: { type: 'string' },
                size: { type: 'number' },
                status: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate], // Require authentication
    handler: async (request, reply) => {
      try {
        const { uploadId } = request.params;
        
        // Complete the upload
        const mediaFile = await uploadService.completeUpload(uploadId);
        
        return reply.send({
          data: {
            id: mediaFile.id,
            original_name: mediaFile.original_name,
            mimeType: mediaFile.mimeType,
            size: mediaFile.size,
            status: mediaFile.status
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        request.log.error('Error completing upload', { error });
        throw error;
      }
    }
  });
  
  // Get upload status
  fastify.get<UploadStatusRequest>('/upload/:uploadId/status', {
    schema: {
      description: 'Get upload status',
      tags: ['media', 'upload'],
      params: {
        type: 'object',
        required: ['uploadId'],
        properties: {
          uploadId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Success response with upload status',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                progress: { type: 'number' },
                message: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate], // Require authentication
    handler: async (request, reply) => {
      try {
        const { uploadId } = request.params;
        
        // Get upload status
        const status = await uploadService.getUploadStatus(uploadId);
        
        return reply.send({
          data: status,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        request.log.error('Error getting upload status', { error });
        throw error;
      }
    }
  });
  
  // Cancel an upload
  fastify.delete<CancelUploadRequest>('/upload/:uploadId', {
    schema: {
      description: 'Cancel an upload',
      tags: ['media', 'upload'],
      params: {
        type: 'object',
        required: ['uploadId'],
        properties: {
          uploadId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Success response',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate], // Require authentication
    handler: async (request, reply) => {
      try {
        const { uploadId } = request.params;
        
        // Cancel the upload
        const success = await uploadService.cancelUpload(uploadId);
        
        return reply.send({
          data: {
            success
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        request.log.error('Error canceling upload', { error });
        throw error;
      }
    }
  });
};

export default fp(uploadRoutes);
