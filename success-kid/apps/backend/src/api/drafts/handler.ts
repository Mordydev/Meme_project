/**
 * Draft API Handlers
 * 
 * Handles all draft-related API operations
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { draftService } from '../../services/content/drafts';
import { 
  CreateDraftDto, 
  UpdateDraftDto, 
  DraftResponse, 
  DraftsResponse, 
  DeleteDraftResponse,
  PublishDraftResponse
} from './types';
import { DraftParamsSchema, DraftQuerySchema, CreateDraftSchema, UpdateDraftSchema } from './schema';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors';
import { logger } from '../../lib/logger';
import { handleApiError } from '../error-handler';

/**
 * Create a new draft
 */
export async function createDraftHandler(
  request: FastifyRequest<{ Body: CreateDraftDto }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate request body
    const validatedData = CreateDraftSchema.parse(request.body);
    
    // Get user ID from auth
    const userId = request.user.id;
    
    // Create the draft
    const draft = await draftService.createDraft(userId, validatedData);
    
    // Return response
    const response: DraftResponse = {
      data: draft,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    reply.code(201).send(response);
  } catch (error) {
    handleApiError(request, reply, error);
  }
}

/**
 * Get a draft by ID
 */
export async function getDraftByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate request params
    const { id } = DraftParamsSchema.parse(request.params);
    
    // Get user ID from auth
    const userId = request.user.id;
    
    // Get the draft
    const draft = await draftService.getDraftById(id, userId);
    
    if (!draft) {
      throw new NotFoundError('Draft', id);
    }
    
    // Return response
    const response: DraftResponse = {
      data: draft,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    reply.code(200).send(response);
  } catch (error) {
    handleApiError(request, reply, error);
  }
}

/**
 * Get all drafts for the authenticated user
 */
export async function getUserDraftsHandler(
  request: FastifyRequest<{ Querystring: { page?: number, pageSize?: number } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate query params
    const { page, pageSize } = DraftQuerySchema.parse(request.query);
    
    // Get user ID from auth
    const userId = request.user.id;
    
    // Get user drafts
    const drafts = await draftService.getUserDrafts(userId);
    
    // Return response
    const response: DraftsResponse = {
      data: drafts,
      meta: {
        timestamp: new Date().toISOString(),
        total: drafts.length
      }
    };
    
    reply.code(200).send(response);
  } catch (error) {
    handleApiError(request, reply, error);
  }
}

/**
 * Update a draft
 */
export async function updateDraftHandler(
  request: FastifyRequest<{ Params: { id: string }, Body: UpdateDraftDto }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate request params and body
    const { id } = DraftParamsSchema.parse(request.params);
    const validatedData = UpdateDraftSchema.parse(request.body);
    
    // Get user ID from auth
    const userId = request.user.id;
    
    // Update the draft
    const updatedDraft = await draftService.updateDraft(id, userId, validatedData);
    
    // Return response
    const response: DraftResponse = {
      data: updatedDraft,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    reply.code(200).send(response);
  } catch (error) {
    handleApiError(request, reply, error);
  }
}

/**
 * Delete a draft
 */
export async function deleteDraftHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate request params
    const { id } = DraftParamsSchema.parse(request.params);
    
    // Get user ID from auth
    const userId = request.user.id;
    
    // Delete the draft
    const deleted = await draftService.deleteDraft(id, userId);
    
    // Return response
    const response: DeleteDraftResponse = {
      data: {
        success: deleted
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    reply.code(200).send(response);
  } catch (error) {
    handleApiError(request, reply, error);
  }
}

/**
 * Publish a draft as content
 */
export async function publishDraftHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate request params
    const { id } = DraftParamsSchema.parse(request.params);
    
    // Get user ID from auth
    const userId = request.user.id;
    
    // Publish the draft
    const content = await draftService.publishDraft(id, userId);
    
    // Return response
    const response: PublishDraftResponse = {
      data: {
        contentId: content.id
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    reply.code(200).send(response);
  } catch (error) {
    handleApiError(request, reply, error);
  }
}
