import { DraftService } from './draft-service';
import { draftRepository } from '../../../repositories/draft-repository';
import { tagRepository } from '../../../repositories/tag-repository';
import { mediaService } from '../../media/media-service';
import { moderationService } from '../../moderation/moderation-service';
import { contentService } from '../index';

// Initialize the service with dependencies
export const draftService = new DraftService(
  draftRepository,
  tagRepository,
  mediaService,
  moderationService,
  contentService
);

// Export types
export * from './draft-service';
