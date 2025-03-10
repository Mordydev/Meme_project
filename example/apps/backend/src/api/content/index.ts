import { FastifyPluginAsync } from 'fastify';
import { getContentHandler } from './get-content';
import { createContentHandler } from './create-content';
import { getContentByIdHandler } from './get-content-by-id';
import { addCommentHandler } from './add-comment';
import { toggleReactionHandler } from './toggle-reaction';
import { reportContentHandler } from './report-content';
import { moderateContentHandler } from './moderate-content';
import { getModerationQueueHandler } from './get-moderation-queue';
import { generateUploadUrlHandler } from './generate-upload-url';
import { getCommunityGuidelinesHandler } from './get-community-guidelines';

const contentRoutes: FastifyPluginAsync = async (fastify) => {
  // Get content feed with filtering and pagination
  fastify.get('/', getContentHandler);
  
  // Create new content
  fastify.post('/', createContentHandler);
  
  // Get specific content by ID
  fastify.get('/:id', getContentByIdHandler);
  
  // Add a comment to content
  fastify.post('/:id/comments', addCommentHandler);
  
  // Toggle a reaction (like, etc.)
  fastify.post('/:id/reactions', toggleReactionHandler);
  
  // Report content for moderation
  fastify.post('/:id/report', reportContentHandler);
  
  // Generate upload URL for media
  fastify.post('/media/upload-url', generateUploadUrlHandler);
  
  // Get community guidelines
  fastify.get('/guidelines', getCommunityGuidelinesHandler);
  
  // === Moderation Routes (Protected by moderator permission) ===
  
  // Get moderation queue
  fastify.get('/moderation/queue', getModerationQueueHandler);
  
  // Moderate specific content
  fastify.post('/:id/moderate', moderateContentHandler);
};

export default contentRoutes;
