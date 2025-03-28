/**
 * Content Service Module
 * 
 * Exports all content-related services
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { ReportRepository } from '../../repositories/report-repository';
import { PointsService } from '../points/points-service';
import { EventBus } from '../../lib/event-bus';
import { ContentService } from './content-service';
import { FeedService } from './feed/feed-service';
import { ContentAnalyticsService } from './analytics/content-analytics-service';
import { SearchService } from './search/search-service';

// Content service factory
export function createContentService(
  contentRepository: ContentRepository,
  commentRepository: CommentRepository,
  categoryRepository: CategoryRepository,
  tagRepository: TagRepository,
  pointsService: PointsService,
  moderationService: any, // Avoid circular dependency
  eventBus: EventBus
): ContentService {
  return new ContentService(
    contentRepository,
    commentRepository,
    categoryRepository,
    tagRepository,
    pointsService,
    moderationService,
    eventBus
  );
}

// Feed service factory
export function createFeedService(
  db: Pool,
  contentRepository: ContentRepository,
  categoryRepository: CategoryRepository,
  tagRepository: TagRepository
): FeedService {
  return new FeedService(
    db,
    contentRepository,
    categoryRepository,
    tagRepository
  );
}

// Content analytics service factory
export function createContentAnalyticsService(
  db: Pool,
  redis: Redis,
  contentRepository: ContentRepository,
  commentRepository: CommentRepository
): ContentAnalyticsService {
  return new ContentAnalyticsService(
    db,
    redis,
    contentRepository,
    commentRepository
  );
}

// Search service factory
export function createSearchService(
  db: Pool,
  redis: Redis,
  contentRepository: ContentRepository,
  tagRepository: TagRepository,
  categoryRepository: CategoryRepository
): SearchService {
  return new SearchService(
    db,
    redis,
    contentRepository,
    tagRepository,
    categoryRepository
  );
}

export { ContentService } from './content-service';
export { FeedService } from './feed/feed-service';
export { ContentAnalyticsService } from './analytics/content-analytics-service';
export { SearchService } from './search/search-service';
