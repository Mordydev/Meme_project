/**
 * Moderation Service Module
 * 
 * Exports moderation service
 */
import { ReportRepository } from '../../repositories/report-repository';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { EventBus } from '../../lib/event-bus';
import { ModerationService } from './moderation-service';

// Moderation service factory
export function createModerationService(
  reportRepository: ReportRepository,
  contentRepository: ContentRepository,
  commentRepository: CommentRepository,
  eventBus: EventBus
): ModerationService {
  return new ModerationService(
    reportRepository,
    contentRepository,
    commentRepository,
    eventBus
  );
}

export { ModerationService } from './moderation-service';
