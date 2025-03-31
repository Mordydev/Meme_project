/**
 * Draft API Routes
 * 
 * Defines all routes for draft operations
 */
import { FastifyInstance } from 'fastify';
import { 
  createDraftHandler, 
  getUserDraftsHandler, 
  getDraftByIdHandler, 
  updateDraftHandler,
  deleteDraftHandler,
  publishDraftHandler
} from './handler';
import { authMiddleware } from '../../middleware/auth';

/**
 * Register draft routes
 */
export async function draftRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  
  // GET /drafts - Get all drafts for authenticated user
  fastify.get('/', getUserDraftsHandler);
  
  // POST /drafts - Create a new draft
  fastify.post('/', createDraftHandler);
  
  // GET /drafts/:id - Get a draft by ID
  fastify.get('/:id', getDraftByIdHandler);
  
  // PUT /drafts/:id - Update a draft
  fastify.put('/:id', updateDraftHandler);
  
  // DELETE /drafts/:id - Delete a draft
  fastify.delete('/:id', deleteDraftHandler);
  
  // POST /drafts/:id/publish - Publish a draft as content
  fastify.post('/:id/publish', publishDraftHandler);
}
