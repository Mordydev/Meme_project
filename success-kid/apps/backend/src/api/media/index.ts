/**
 * Media API Routes
 * 
 * Handles all media-related API endpoints
 */
import { FastifyPluginAsync } from 'fastify';
import { NotFoundError, ForbiddenError } from '../../errors/api-errors';
import { PermissionType } from '../../models/media/media-permission';
import multer from 'fastify-multer';
import { getUserIdFromRequest } from '../../lib/auth-utils';

/**
 * Configure media routes
 */
const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  // Register multer for file uploads
  fastify.register(multer.contentParser);
  
  // Configure upload middleware
  const upload = multer({
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB default limit
    },
    storage: multer.memoryStorage()
  });
  
  // Get media service
  const { mediaService } = fastify.services;
  
  /**
   * @openapi
   * /api/v1/media/upload:
   *   post:
   *     summary: Upload a media file
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               folder:
   *                 type: string
   *               generateVariants:
   *                 type: boolean
   *               visibility:
   *                 type: string
   *                 enum: [public, private]
   *     responses:
   *       200:
   *         description: Media file uploaded successfully
   */
  fastify.post('/upload', { preHandler: upload.single('file') }, async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Handle the upload
      const result = await mediaService.handleUploadRequest(
        request as any, 
        userId
      );
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/upload/url:
   *   post:
   *     summary: Get a presigned URL for direct upload
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [filename, mimeType, size]
   *             properties:
   *               filename:
   *                 type: string
   *               mimeType:
   *                 type: string
   *               size:
   *                 type: number
   *               folder:
   *                 type: string
   *               visibility:
   *                 type: string
   *                 enum: [public, private]
   *     responses:
   *       200:
   *         description: Presigned URL generated successfully
   */
  fastify.post('/upload/url', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Validate request body
      const { filename, mimeType, size, folder, visibility } = request.body as any;
      
      if (!filename || !mimeType || !size) {
        throw new Error('Missing required fields: filename, mimeType, size');
      }
      
      // Get upload URL
      const result = await mediaService.upload.getUploadUrl(userId, {
        filename,
        mimeType,
        size,
        folder,
        visibility
      });
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/upload/complete:
   *   post:
   *     summary: Complete a direct upload initiated with presigned URL
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [mediaId]
   *             properties:
   *               mediaId:
   *                 type: string
   *               generateVariants:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Upload completed successfully
   */
  fastify.post('/upload/complete', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Validate request body
      const { mediaId, generateVariants } = request.body as any;
      
      if (!mediaId) {
        throw new Error('Missing required field: mediaId');
      }
      
      // Complete the upload
      const result = await mediaService.upload.completeUpload(mediaId, generateVariants);
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/upload/cancel:
   *   post:
   *     summary: Cancel an in-progress upload
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [mediaId]
   *             properties:
   *               mediaId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Upload cancelled successfully
   */
  fastify.post('/upload/cancel', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Validate request body
      const { mediaId } = request.body as any;
      
      if (!mediaId) {
        throw new Error('Missing required field: mediaId');
      }
      
      // Cancel the upload
      const result = await mediaService.upload.cancelUpload(mediaId);
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media:
   *   get:
   *     summary: Get media items with filtering options
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: query
   *         schema:
   *           type: string
   *       - name: type
   *         in: query
   *         schema:
   *           type: string
   *       - name: status
   *         in: query
   *         schema:
   *           type: string
   *       - name: limit
   *         in: query
   *         schema:
   *           type: number
   *       - name: offset
   *         in: query
   *         schema:
   *           type: number
   *       - name: lastId
   *         in: query
   *         schema:
   *           type: string
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *       - name: sortBy
   *         in: query
   *         schema:
   *           type: string
   *           enum: [newest, oldest, size, name]
   *     responses:
   *       200:
   *         description: Media items retrieved successfully
   */
  fastify.get('/', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get query parameters
      const {
        userId: queryUserId,
        type,
        status,
        limit,
        offset,
        lastId,
        search,
        sortBy
      } = request.query as any;
      
      // Only allow getting own media or admin
      const targetUserId = queryUserId || userId;
      
      if (targetUserId !== userId && !request.user?.isAdmin) {
        throw new ForbiddenError('Can only access your own media');
      }
      
      // Get media items
      const media = await fastify.db.repositories.media.getMedia({
        userId: targetUserId,
        type,
        status,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        lastId,
        search,
        sortBy
      });
      
      return reply.send({
        data: media,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}:
   *   get:
   *     summary: Get a media item by ID
   *     tags: [Media]
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Media item retrieved successfully
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      // Get user ID (optional - might be public media)
      const userId = getUserIdFromRequest(request, false);
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Get media from repository
      const media = await fastify.db.repositories.media.getMediaWithDetails(id);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check if media is public or user has access
      if (!media.publicUrl && userId) {
        const hasPermission = await mediaService.access.hasPermission(
          id,
          userId,
          PermissionType.READ
        );
        
        if (!hasPermission) {
          throw new ForbiddenError('No permission to access media');
        }
      } else if (!media.publicUrl && !userId) {
        throw new ForbiddenError('Authentication required to access media');
      }
      
      return reply.send({
        data: media,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/permissions:
   *   get:
   *     summary: Get permissions for a media item
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Media permissions retrieved successfully
   */
  fastify.get('/:id/permissions', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Get permissions
      const permissions = await mediaService.access.getMediaPermissions(id, userId);
      
      return reply.send({
        data: permissions,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/permissions:
   *   post:
   *     summary: Add a permission for a media item
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [entityType, permission]
   *             properties:
   *               entityType:
   *                 type: string
   *                 enum: [user, role, public]
   *               entityId:
   *                 type: string
   *               permission:
   *                 type: string
   *                 enum: [read, write, delete]
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Permission added successfully
   */
  fastify.post('/:id/permissions', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Validate request body
      const {
        entityType,
        entityId,
        permission,
        expiresAt
      } = request.body as any;
      
      // Grant permission
      const result = await mediaService.access.grantPermission(id, userId, {
        entityType,
        entityId,
        permission,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/permissions/{permissionId}:
   *   delete:
   *     summary: Remove a permission for a media item
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: permissionId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Permission removed successfully
   */
  fastify.delete('/permissions/:permissionId', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get permission ID
      const { permissionId } = request.params as { permissionId: string };
      
      // Revoke permission
      const result = await mediaService.access.revokePermission(permissionId, userId);
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/url:
   *   get:
   *     summary: Get a URL for a media item
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: variant
   *         in: query
   *         schema:
   *           type: string
   *       - name: width
   *         in: query
   *         schema:
   *           type: number
   *       - name: height
   *         in: query
   *         schema:
   *           type: number
   *       - name: format
   *         in: query
   *         schema:
   *           type: string
   *       - name: quality
   *         in: query
   *         schema:
   *           type: number
   *       - name: download
   *         in: query
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Media URL generated successfully
   */
  fastify.get('/:id/url', async (request, reply) => {
    try {
      // Get user ID (optional - might be public media)
      const userId = getUserIdFromRequest(request, false);
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Get query parameters
      const {
        variant,
        width,
        height,
        format,
        quality,
        download
      } = request.query as any;
      
      // Get URL
      const url = await mediaService.delivery.getMediaUrl(
        id,
        userId,
        {
          variant,
          resize: (width || height) ? {
            width: width ? parseInt(width, 10) : undefined,
            height: height ? parseInt(height, 10) : undefined
          } : undefined,
          format,
          quality: quality ? parseInt(quality, 10) : undefined,
          download: download === 'true' || download === '1'
        }
      );
      
      return reply.send({
        data: { url },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/transform:
   *   post:
   *     summary: Transform an image
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               resize:
   *                 type: object
   *                 properties:
   *                   width:
   *                     type: number
   *                   height:
   *                     type: number
   *                   fit:
   *                     type: string
   *                     enum: [cover, contain, fill, inside, outside]
   *               format:
   *                 type: string
   *               quality:
   *                 type: number
   *     responses:
   *       200:
   *         description: Image transformed successfully
   */
  fastify.post('/:id/transform', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Check permission
      const hasPermission = await mediaService.access.hasPermission(
        id,
        userId,
        PermissionType.READ
      );
      
      if (!hasPermission) {
        throw new ForbiddenError('No permission to access media');
      }
      
      // Validate request body
      const { resize, format, quality } = request.body as any;
      
      // Process transformation
      const result = await mediaService.processing.transformImage(id, {
        resize,
        format,
        quality
      });
      
      // Set appropriate content type
      if (format) {
        reply.header('Content-Type', `image/${format}`);
      }
      
      // Return the transformed image
      return reply.send(result.buffer);
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/watermark:
   *   post:
   *     summary: Apply a watermark to an image
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               text:
   *                 type: string
   *               position:
   *                 type: string
   *                 enum: [center, top, bottom, left, right, top-left, top-right, bottom-left, bottom-right]
   *               opacity:
   *                 type: number
   *     responses:
   *       200:
   *         description: Watermark applied successfully
   */
  fastify.post('/:id/watermark', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Check permission
      const hasPermission = await mediaService.access.hasPermission(
        id,
        userId,
        PermissionType.READ
      );
      
      if (!hasPermission) {
        throw new ForbiddenError('No permission to access media');
      }
      
      // Validate request body
      const { text, position, opacity } = request.body as any;
      
      // Apply watermark
      const result = await mediaService.processing.applyWatermark(id, {
        text,
        position,
        opacity
      });
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/temp-access:
   *   post:
   *     summary: Create temporary access for a media item
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [duration, permissions]
   *             properties:
   *               duration:
   *                 type: number
   *                 description: Duration in seconds
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [read, write, delete]
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Temporary access created successfully
   */
  fastify.post('/:id/temp-access', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Validate request body
      const { duration, permissions, metadata } = request.body as any;
      
      if (!duration || !permissions || !Array.isArray(permissions)) {
        throw new Error('Missing required fields: duration, permissions');
      }
      
      // Create temporary access
      const token = await mediaService.access.createTemporaryAccess(id, userId, {
        duration,
        permissions,
        metadata
      });
      
      return reply.send({
        data: { token },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/serve/{path}:
   *   get:
   *     summary: Serve a media file
   *     tags: [Media]
   *     parameters:
   *       - name: path
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: variant
   *         in: query
   *         schema:
   *           type: string
   *       - name: width
   *         in: query
   *         schema:
   *           type: number
   *       - name: height
   *         in: query
   *         schema:
   *           type: number
   *       - name: format
   *         in: query
   *         schema:
   *           type: string
   *       - name: quality
   *         in: query
   *         schema:
   *           type: number
   *       - name: download
   *         in: query
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Media file served successfully
   */
  fastify.get('/serve/:path(*)', async (request, reply) => {
    try {
      // Get path parameter (this gets the full path after /serve/)
      const { path } = request.params as { path: string };
      
      // Get query parameters
      const {
        variant,
        width,
        height,
        format,
        quality,
        download,
        mediaId,
        expires,
        signature
      } = request.query as any;
      
      // Get user ID (optional - might be public media)
      const userId = getUserIdFromRequest(request, false);
      
      // Find media by path
      const media = await fastify.db.repositories.media.findByPath(path);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check for signed URL parameters
      if (mediaId && expires && signature) {
        // Verify signed URL
        const isValid = await mediaService.access.verifySignedUrl(
          mediaId,
          path,
          parseInt(expires, 10),
          signature
        );
        
        if (!isValid) {
          throw new ForbiddenError('Invalid or expired signature');
        }
      } else if (!media.publicUrl && userId) {
        // Check user permission
        const hasPermission = await mediaService.access.hasPermission(
          media.id,
          userId,
          PermissionType.READ
        );
        
        if (!hasPermission) {
          throw new ForbiddenError('No permission to access media');
        }
      } else if (!media.publicUrl && !userId) {
        throw new ForbiddenError('Authentication required to access media');
      }
      
      // Check for range header (video streaming)
      const rangeHeader = request.headers.range;
      
      if (rangeHeader) {
        return mediaService.handleRangeRequest(media.id, userId, rangeHeader, reply);
      }
      
      // Stream media
      await mediaService.handleMediaDelivery(
        media.id,
        userId,
        reply,
        {
          variant,
          width: width ? parseInt(width, 10) : undefined,
          height: height ? parseInt(height, 10) : undefined,
          format,
          quality: quality ? parseInt(quality, 10) : undefined,
          download: download === 'true' || download === '1'
        },
        request.headers as Record<string, string | undefined>
      );
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/{id}/delete:
   *   delete:
   *     summary: Delete a media item
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Media item deleted successfully
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Get media ID
      const { id } = request.params as { id: string };
      
      // Get media to check ownership
      const media = await fastify.db.repositories.media.findById(id);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check if user is owner or has delete permission
      const isOwner = media.userId === userId;
      const hasPermission = isOwner || await mediaService.access.hasPermission(
        id,
        userId,
        PermissionType.DELETE
      );
      
      if (!hasPermission) {
        throw new ForbiddenError('No permission to delete media');
      }
      
      // Update status to deleted
      await fastify.db.repositories.media.updateMedia(id, {
        status: MediaStatus.DELETED
      });
      
      // Queue deletion from storage
      await mediaService.maintenance.maintenanceQueue.add('deleteMedia', { mediaId: id });
      
      return reply.send({
        data: { success: true },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/maintenance/cleanup:
   *   post:
   *     summary: Run media cleanup
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [orphaned, temporary]
   *               olderThan:
   *                 type: number
   *               dryRun:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Cleanup job queued successfully
   */
  fastify.post('/maintenance/cleanup', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Check if user is admin
      if (!request.user?.isAdmin) {
        throw new ForbiddenError('Admin access required');
      }
      
      // Validate request body
      const { type, olderThan, dryRun } = request.body as any;
      
      let result;
      
      if (type === 'orphaned') {
        result = await mediaService.maintenance.cleanupOrphanedMedia({
          olderThan,
          dryRun
        });
      } else if (type === 'temporary') {
        result = await mediaService.maintenance.cleanupTemporaryMedia({
          olderThan,
          dryRun
        });
      } else {
        throw new Error('Invalid cleanup type');
      }
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * @openapi
   * /api/v1/media/maintenance/analyze:
   *   post:
   *     summary: Analyze media storage usage
   *     tags: [Media]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Analysis job queued successfully
   */
  fastify.post('/maintenance/analyze', async (request, reply) => {
    try {
      // Get user ID
      const userId = getUserIdFromRequest(request);
      
      if (!userId) {
        throw new ForbiddenError('Authentication required');
      }
      
      // Check if user is admin
      if (!request.user?.isAdmin) {
        throw new ForbiddenError('Admin access required');
      }
      
      // Run analysis
      const result = await mediaService.maintenance.analyzeStorageUsage();
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      throw error;
    }
  });
};

export default mediaRoutes;
