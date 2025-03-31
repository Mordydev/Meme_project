import { logger } from '../../../lib/logger';
import { ContentRepository, contentRepository } from '../../../repositories/content-repository';
import { CategoryRepository } from '../../../repositories/category-repository'; // Import class only
import { TagRepository } from '../../../repositories/tag-repository'; // Import class only
import { ContentListItem } from '../../../models/entities/content.model';
import { NotFoundError } from '../../../errors';
import { Tag } from '../../../database/schema/tags'; // Assuming Tag type exists
import { db } from '../../../database'; // Import db for potential custom queries

/**
 * Content feed options (Copied from content-service.ts)
 */
export interface ContentFeedOptions {
  lastId?: string;
  lastCreatedAt?: Date;
  limit?: number;
  type?: string; // Filter by content type (e.g., 'post', 'poll')
  categoryId?: string;
  userId?: string; // Filter by author
  tags?: string[]; // Filter by tags (slugs or IDs)
  // Add options for sorting (e.g., 'latest', 'popular', 'trending')
  sortBy?: 'latest' | 'popular' | 'trending';
  orderBy?: string; // Add orderBy
  orderDir?: 'asc' | 'desc'; // Add orderDir
  timeframe?: 'day' | 'week' | 'month' | 'all'; // For trending/popular
}

/**
 * Service responsible for generating content feeds.
 */
export class FeedService {
  constructor(
    private contentRepository: ContentRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository
    // Potentially inject other repositories/services if needed for complex feeds (e.g., user follow graph)
  ) {}

  /**
   * Get a generic content feed based on options.
   * This acts as the main entry point, delegating to specific feed types or applying filters.
   * 
   * @param options Feed options including sorting, filtering, and pagination.
   * @returns Array of content list items.
   */
  async getFeed(options: ContentFeedOptions = {}): Promise<ContentListItem[]> {
    logger.debug('Getting content feed with options', { options });
    try {
        // TODO: Implement different sorting logic based on options.sortBy
        if (options.sortBy === 'trending' || options.sortBy === 'popular') {
            logger.warn(`Feed sorting by ${options.sortBy} not yet implemented. Defaulting to latest.`);
            // Placeholder: Fallback to latest for now
            options.sortBy = 'latest'; 
        }
        
        // Default sort order if not provided via sortBy
        if (!options.sortBy) {
            options.orderBy = options.orderBy || 'createdAt';
            options.orderDir = options.orderDir || 'desc';
        } else {
             // TODO: Map sortBy to actual orderBy columns and directions
             options.orderBy = 'createdAt'; // Placeholder
             options.orderDir = 'desc'; // Placeholder
        }


        // Handle tag filtering (convert slugs to IDs if necessary)
        let tagIds: string[] | undefined;
        if (options.tags && options.tags.length > 0) {
            // Assuming tags are provided as slugs, find their IDs
            // TODO: Implement findManyBySlugs in TagRepository
            const foundTags: Tag[] = await this.tagRepository.findManyBySlugs(options.tags); 
            tagIds = foundTags.map((t: Tag) => t.id); // Fix implicit any
            if (tagIds.length === 0) return []; // No content if tags don't exist
        }

        // Call the repository method (assuming it handles these filters)
        // TODO: Implement/update getContentFeed in ContentRepository to handle tagIds and sorting
        const items = await this.contentRepository.getContentFeed({ ...options, tagIds });

        // Ensure contentText, mediaUrls, and stats are correctly typed/structured
        return items.map(item => ({
            ...item,
            contentText: item.contentText || '',
            // Ensure mediaUrls is an array, default to empty array if null/undefined/not array
            mediaUrls: Array.isArray(item.mediaUrls) ? item.mediaUrls : [],
            // Map stats - Ensure item.stats exists and map properties correctly
            stats: {
                // Assuming item.stats might be undefined or have different properties
                likes: (item.stats as any)?.reactions || (item.stats as any)?.likes || 0, 
                comments: (item.stats as any)?.comments || 0,
                shares: (item.stats as any)?.shares || 0 
            }
        }));

    } catch (error: unknown) { // Fix unknown error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting content feed', { options, error: errorMessage });
      throw new Error(`Failed to get content feed: ${errorMessage}`);
    }
  }

   /**
   * Get content by category.
   * 
   * @param categoryId Category ID
   * @param options Feed options (excluding categoryId)
   * @returns Array of content items
   */
  async getContentByCategory(categoryId: string, options: Omit<ContentFeedOptions, 'categoryId'> = {}): Promise<ContentListItem[]> {
    logger.debug('Getting content by category', { categoryId, options });
    try {
      // Verify category exists
      // TODO: Ensure findById exists on CategoryRepository (should if extends BaseRepository)
      const category = await this.categoryRepository.findById(categoryId); 
      if (!category) {
        throw new NotFoundError('Category', categoryId);
      }

      // Get content feed with category filter
      return await this.getFeed({
        ...options,
        categoryId
      });
    } catch (error: unknown) { // Fix unknown error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting content by category', { categoryId, options, error: errorMessage });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get content by category: ${errorMessage}`);
    }
  }

  /**
   * Get content by tag.
   * 
   * @param tagSlug Tag slug
   * @param options Feed options (excluding tags)
   * @returns Array of content items
   */
  async getContentByTag(tagSlug: string, options: Omit<ContentFeedOptions, 'tags'> = {}): Promise<ContentListItem[]> {
     logger.debug('Getting content by tag', { tagSlug, options });
    try {
      // Verify tag exists
      // TODO: Implement getTagBySlug in TagRepository
      const tag = await this.tagRepository.getTagBySlug(tagSlug); 
      if (!tag) {
        throw new NotFoundError('Tag', tagSlug);
      }

      // Get content feed with tag filter
      return await this.getFeed({
      ...options,
      tags: [tagSlug] // Pass slug, getFeed will resolve ID (assuming findManyBySlugs works)
      });
    // Handle contentText nullability - ContentListItem might expect non-null contentText
    // This ensures we return a consistent type even if DB allows nulls
    return await this.getFeed({
      ...options,
      tags: [tagSlug] // Pass slug, getFeed will resolve ID (assuming findManyBySlugs works)
    }).then(items => {
      // Ensure contentText is at least an empty string if null
      return items.map(item => ({
        ...item,
        contentText: item.contentText || ''
      }));
    });
    } catch (error: unknown) { // Fix unknown error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting content by tag', { tagSlug, options, error: errorMessage });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get content by tag: ${errorMessage}`);
    }
  }

  // Add methods for specific feed types like 'trending', 'popular', 'personal' (following) if needed
  // These might involve more complex logic, potentially using Redis or different repository methods.

}

// Import repository instances separately for instantiation
import { tagRepository } from '../../../repositories/tag-repository'; 
// Assuming categoryRepository instance is injected via constructor or DI setup
// Remove the incorrect import of categoryRepository instance below
// import { categoryRepository } from '../../../repositories/category-repository'; 

// Export a singleton instance using imported repository instances
// Note: Instantiation might happen elsewhere (e.g., services/index.ts) if using DI
// For now, assuming constructor injection works or manual instantiation happens elsewhere.
// If this service needs a singleton export, it should likely import instances from a central index.
// Example: export const feedService = new FeedService(contentRepository, categoryRepositoryInstance, tagRepository);
// Removing the direct export for now as instance management seems unclear.
// export const feedService = new FeedService(contentRepository, categoryRepository, tagRepository); 
// ^^^ Commenting out potentially problematic direct instantiation/export
