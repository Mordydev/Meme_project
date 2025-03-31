/**
 * Draft Service
 * 
 * Handles operations related to content drafts - saving, retrieving, publishing, and deleting
 */
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '../../../lib/sanitizer';
import { logger } from '../../../lib/logger';
import { DraftRepository, draftRepository } from '../../../repositories/draft-repository';
import { TagRepository, tagRepository } from '../../../repositories/tag-repository';
import { MediaService, mediaService } from '../../media/media-service';
import { ModerationService } from '../../moderation/moderation-service';
import { ContentService } from '../content-service';
import { Draft, DraftResponseDto, NewDraft } from '../../../database/schema/drafts';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../errors';

// Import types needed for publishing drafts
import { CreateContentDto } from '../../../models/entities/content.model';

export interface CreateDraftDto {
  type: string;
  contentText?: string;
  mediaUrls?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDraftDto {
  contentText?: string;
  mediaUrls?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export class DraftService {
  constructor(
    private draftRepository: DraftRepository,
    private tagRepository: TagRepository,
    private mediaService: MediaService,
    private moderationService: ModerationService,
    private contentService: ContentService
  ) {}

  /**
   * Create a new draft
   * @param userId User ID
   * @param data Draft data
   * @returns Created draft
   */
  async createDraft(userId: string, data: CreateDraftDto): Promise<DraftResponseDto> {
    try {
      // Sanitize text content for security
      let sanitizedText: string | null | undefined = data.contentText;
      if (sanitizedText) {
        sanitizedText = sanitizeHtml(sanitizedText);
      }

      // Generate UUID for the draft
      const draftId = uuidv4();

      // Prepare data for repository
      const draftData: NewDraft = {
        id: draftId,
        userId: userId,
        type: data.type,
        contentText: sanitizedText,
        mediaUrls: data.mediaUrls || [],
        metadata: data.metadata || {}
      };

      // Create the draft
      const draft = await this.draftRepository.createDraft(draftData);

      // Process tags if provided
      let tags = [];
      if (data.tags && data.tags.length > 0) {
        tags = await this.tagRepository.findOrCreateTags(data.tags);
      }

      // Enhance with tags
      const draftWithTags: DraftResponseDto = {
        ...draft,
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color
        }))
      };

      logger.info(`User ${userId} created new draft ${draftId} of type ${data.type}`);
      return draftWithTags;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating draft', { userId, error: errorMessage });
      throw new Error(`Failed to create draft: ${errorMessage}`);
    }
  }

  /**
   * Update an existing draft
   * @param draftId Draft ID
   * @param userId User ID (for authorization)
   * @param data Draft data to update
   * @returns Updated draft
   */
  async updateDraft(draftId: string, userId: string, data: UpdateDraftDto): Promise<DraftResponseDto> {
    try {
      // Get existing draft to check ownership
      const existingDraft = await this.draftRepository.findById(draftId);
      if (!existingDraft) {
        throw new NotFoundError('Draft', draftId);
      }

      // Check ownership
      if (existingDraft.userId !== userId) {
        throw new ForbiddenError('You can only update your own drafts');
      }

      // Sanitize text content for security
      let sanitizedText: string | undefined = undefined;
      if (data.contentText) {
        sanitizedText = sanitizeHtml(data.contentText);
      }

      // Prepare data for repository update
      const updateData: Partial<NewDraft> = {
        contentText: sanitizedText,
        mediaUrls: data.mediaUrls,
        metadata: data.metadata,
        lastSaved: new Date() // Update the lastSaved timestamp
      };

      // Update the draft
      await this.draftRepository.updateDraft(draftId, updateData);

      // Process tags if provided
      let tags = [];
      if (data.tags && data.tags.length > 0) {
        tags = await this.tagRepository.findOrCreateTags(data.tags);
      }

      // Get the updated draft
      const updatedDraft = await this.draftRepository.findById(draftId);
      if (!updatedDraft) {
        throw new Error('Failed to retrieve updated draft');
      }

      // Enhance with tags
      const draftWithTags: DraftResponseDto = {
        ...updatedDraft,
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color
        }))
      };

      logger.info(`User ${userId} updated draft ${draftId}`);
      return draftWithTags;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating draft', { draftId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to update draft: ${errorMessage}`);
    }
  }

  /**
   * Get a draft by ID
   * @param draftId Draft ID
   * @param userId User ID (for authorization)
   * @returns Draft or null if not found
   */
  async getDraftById(draftId: string, userId: string): Promise<DraftResponseDto | null> {
    try {
      // Get draft
      const draft = await this.draftRepository.findById(draftId);
      if (!draft) {
        return null;
      }

      // Check ownership
      if (draft.userId !== userId) {
        throw new ForbiddenError('You can only access your own drafts');
      }

      // Get tags
      const tags = await this.tagRepository.getDraftTags(draftId);

      // Enhance with tags
      const draftWithTags: DraftResponseDto = {
        ...draft,
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color
        }))
      };

      return draftWithTags;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting draft by ID', { draftId, userId, error: errorMessage });
      if (error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to get draft by ID: ${errorMessage}`);
    }
  }

  /**
   * Get all drafts for a user
   * @param userId User ID
   * @returns Array of drafts
   */
  async getUserDrafts(userId: string): Promise<DraftResponseDto[]> {
    try {
      // Get all drafts for the user
      const drafts = await this.draftRepository.findByUserId(userId, {
        sort: { field: 'lastSaved', direction: 'desc' }
      });

      // Get tags for each draft
      const draftsWithTags = await Promise.all(
        drafts.map(async (draft) => {
          const tags = await this.tagRepository.getDraftTags(draft.id);
          return {
            ...draft,
            tags: tags.map(tag => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
              color: tag.color
            }))
          };
        })
      );

      return draftsWithTags;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting user drafts', { userId, error: errorMessage });
      throw new Error(`Failed to get user drafts: ${errorMessage}`);
    }
  }

  /**
   * Delete a draft
   * @param draftId Draft ID
   * @param userId User ID (for authorization)
   * @returns True if deleted successfully
   */
  async deleteDraft(draftId: string, userId: string): Promise<boolean> {
    try {
      // Get existing draft to check ownership
      const existingDraft = await this.draftRepository.findById(draftId);
      if (!existingDraft) {
        throw new NotFoundError('Draft', draftId);
      }

      // Check ownership
      if (existingDraft.userId !== userId) {
        throw new ForbiddenError('You can only delete your own drafts');
      }

      // Delete the draft
      const deleted = await this.draftRepository.deleteDraft(draftId);

      logger.info(`User ${userId} deleted draft ${draftId}`);
      return deleted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting draft', { draftId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to delete draft: ${errorMessage}`);
    }
  }

  /**
   * Publish a draft as content
   * @param draftId Draft ID
   * @param userId User ID (for authorization)
   * @returns Published content
   */
  async publishDraft(draftId: string, userId: string): Promise<any> {
    try {
      // Get existing draft to check ownership
      const draft = await this.getDraftById(draftId, userId);
      if (!draft) {
        throw new NotFoundError('Draft', draftId);
      }

      // Convert draft to content dto
      const contentDto: CreateContentDto = {
        type: draft.type,
        contentText: draft.contentText,
        mediaUrls: draft.mediaUrls,
        metadata: draft.metadata,
        tags: draft.tags?.map(tag => tag.name)
      };

      // Use ContentService to create content
      const content = await this.contentService.createContent(userId, contentDto);

      // Delete the draft since it's now been published
      await this.draftRepository.deleteDraft(draftId);

      logger.info(`User ${userId} published draft ${draftId} as content ${content.id}`);
      return content;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error publishing draft', { draftId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to publish draft: ${errorMessage}`);
    }
  }
}

// Note: We will need to add the TagRepository.getDraftTags method
// This will be implemented later in this implementation plan
