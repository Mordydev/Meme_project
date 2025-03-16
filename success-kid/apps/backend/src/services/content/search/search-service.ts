/**
 * Search Service
 * 
 * Handles content search functionality
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { logger } from '../../../lib/logger';
import { ContentRepository } from '../../../repositories/content-repository';
import { ContentListItem } from '../../../models/entities/content.model';
import { TagRepository } from '../../../repositories/tag-repository';
import { CategoryRepository } from '../../../repositories/category-repository';

/**
 * Search result with highlighting
 */
export interface SearchResultWithHighlight extends ContentListItem {
  highlights?: string[];
}

/**
 * Search filter options
 */
export interface SearchFilter {
  contentType?: string;
  categoryId?: string;
  tagId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  type: 'tag' | 'category' | 'term';
  text: string;
  count: number;
}

/**
 * Service for content search
 */
export class SearchService {
  /**
   * Create a new SearchService
   * 
   * @param db Database connection pool
   * @param redis Redis client for caching
   * @param contentRepository Repository for content data
   * @param tagRepository Repository for tag data
   * @param categoryRepository Repository for category data
   */
  constructor(
    private db: Pool,
    private redis: Redis,
    private contentRepository: ContentRepository,
    private tagRepository: TagRepository,
    private categoryRepository: CategoryRepository
  ) {}

  /**
   * Search content by query
   * 
   * @param query Search query
   * @param filter Filter options
   * @param limit Maximum number of results
   * @param offset Pagination offset
   * @returns Search results with highlighting
   */
  async searchContent(
    query: string,
    filter: SearchFilter = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResultWithHighlight[]> {
    try {
      // Check cache if no filters are applied
      if (Object.keys(filter).length === 0 && limit === 20 && offset === 0) {
        const cacheKey = `search:${query.toLowerCase()}`;
        const cachedResults = await this.redis.get(cacheKey);
        
        if (cachedResults) {
          return JSON.parse(cachedResults);
        }
      }
      
      // Clean query
      const cleanQuery = this.sanitizeQuery(query);
      if (!cleanQuery) {
        return [];
      }
      
      // Build search query
      const searchQuery = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM content_reactions WHERE content_id = c.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
          -- Search-specific fields
          ts_rank(c.search_vector, to_tsquery('english', $1)) as search_rank,
          ts_headline('english', c.content_text, to_tsquery('english', $1), 'StartSel=**,StopSel=**,MaxWords=20,MinWords=10,ShortWord=3,MaxFragments=3') as headline
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.status = 'active'
        AND c.search_vector @@ to_tsquery('english', $1)
      `;
      
      const params: any[] = [this.formatQueryForTsQuery(cleanQuery)];
      let paramIndex = 2;
      
      // Apply filters
      let filterQuery = '';
      
      if (filter.contentType) {
        filterQuery += ` AND c.type = $${paramIndex++}`;
        params.push(filter.contentType);
      }
      
      if (filter.categoryId) {
        filterQuery += ` AND c.category_id = $${paramIndex++}`;
        params.push(filter.categoryId);
      }
      
      if (filter.tagId) {
        filterQuery += ` AND $${paramIndex++} = ANY(SELECT tag_id FROM content_tags WHERE content_id = c.id)`;
        params.push(filter.tagId);
      }
      
      if (filter.userId) {
        filterQuery += ` AND c.user_id = $${paramIndex++}`;
        params.push(filter.userId);
      }
      
      if (filter.dateFrom) {
        filterQuery += ` AND c.created_at >= $${paramIndex++}`;
        params.push(filter.dateFrom);
      }
      
      if (filter.dateTo) {
        filterQuery += ` AND c.created_at <= $${paramIndex++}`;
        params.push(filter.dateTo);
      }
      
      // Complete query with sorting, limit, and offset
      const fullQuery = `
        ${searchQuery}${filterQuery}
        ORDER BY search_rank DESC, c.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      params.push(limit, offset);
      
      const result = await this.db.query(fullQuery, params);
      
      // Map to search results with highlights
      const searchResults = result.rows.map(row => {
        // Extract highlights from headline
        const highlightMatches = row.headline.match(/\*\*(.*?)\*\*/g);
        const highlights = highlightMatches 
          ? highlightMatches.map(match => match.replace(/\*\*/g, '')) 
          : [];
        
        // Create search result
        return {
          id: row.id,
          user_id: row.user_id,
          type: row.type,
          content_text: row.content_text,
          media_urls: row.media_urls || [],
          created_at: row.created_at,
          status: row.status,
          
          // Author information
          author: {
            id: row.user_id,
            display_name: row.author_name,
            avatar_url: row.author_avatar
          },
          
          // Stats
          stats: {
            likes: parseInt(row.like_count || '0'),
            comments: parseInt(row.comment_count || '0'),
            shares: 0 // Will implement later
          },
          
          // Highlights
          highlights
        };
      });
      
      // Cache results if no filters
      if (Object.keys(filter).length === 0 && limit === 20 && offset === 0) {
        const cacheKey = `search:${query.toLowerCase()}`;
        await this.redis.set(cacheKey, JSON.stringify(searchResults), 'EX', 3600); // 1 hour cache
      }
      
      // Track search query for analytics
      this.trackSearchQuery(query, searchResults.length, Object.keys(filter).length > 0);
      
      return searchResults;
    } catch (error) {
      logger.error('Error searching content', { error, query, filter, limit, offset });
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   * 
   * @param partialQuery Partial search query
   * @param limit Maximum number of suggestions
   * @returns Search suggestions
   */
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      if (!partialQuery || partialQuery.length < 2) {
        return [];
      }
      
      // Clean query
      const cleanQuery = this.sanitizeQuery(partialQuery);
      if (!cleanQuery) {
        return [];
      }
      
      // Check cache
      const cacheKey = `search:suggestions:${cleanQuery.toLowerCase()}`;
      const cachedSuggestions = await this.redis.get(cacheKey);
      
      if (cachedSuggestions) {
        return JSON.parse(cachedSuggestions);
      }
      
      // Get suggestions from various sources
      const suggestions: SearchSuggestion[] = [];
      
      // Get tag suggestions
      const tagQuery = `
        SELECT name, usage_count
        FROM tags
        WHERE name ILIKE $1
        ORDER BY usage_count DESC
        LIMIT $2
      `;
      
      const tagResult = await this.db.query(tagQuery, [`%${cleanQuery}%`, limit]);
      
      tagResult.rows.forEach(row => {
        suggestions.push({
          type: 'tag',
          text: row.name,
          count: parseInt(row.usage_count)
        });
      });
      
      // Get category suggestions
      const categoryQuery = `
        SELECT c.name, COUNT(co.id) as content_count
        FROM categories c
        LEFT JOIN content co ON c.id = co.category_id
        WHERE c.name ILIKE $1
        GROUP BY c.name
        ORDER BY content_count DESC
        LIMIT $2
      `;
      
      const categoryResult = await this.db.query(categoryQuery, [`%${cleanQuery}%`, limit]);
      
      categoryResult.rows.forEach(row => {
        suggestions.push({
          type: 'category',
          text: row.name,
          count: parseInt(row.content_count)
        });
      });
      
      // Get term suggestions
      const termQuery = `
        WITH popular_terms AS (
          SELECT word
          FROM ts_stat('SELECT to_tsvector(''english'', content_text) FROM content')
          WHERE word ILIKE $1
          ORDER BY ndoc DESC, nentry DESC
          LIMIT $2
        )
        SELECT word, COUNT(*) as count
        FROM popular_terms
        CROSS JOIN content
        WHERE to_tsvector('english', content_text) @@ to_tsquery('english', word)
        GROUP BY word
        ORDER BY count DESC
      `;
      
      const termResult = await this.db.query(termQuery, [`${cleanQuery}%`, limit]);
      
      termResult.rows.forEach(row => {
        suggestions.push({
          type: 'term',
          text: row.word,
          count: parseInt(row.count)
        });
      });
      
      // Sort and limit suggestions
      const sortedSuggestions = suggestions
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      // Cache suggestions
      await this.redis.set(cacheKey, JSON.stringify(sortedSuggestions), 'EX', 3600); // 1 hour cache
      
      return sortedSuggestions;
    } catch (error) {
      logger.error('Error getting search suggestions', { error, partialQuery, limit });
      return [];
    }
  }

  /**
   * Get filter options for search (facets)
   * 
   * @param query Search query
   * @returns Filter options with counts
   */
  async getSearchFilters(query: string): Promise<{
    contentTypes: { type: string; count: number }[];
    categories: { id: string; name: string; count: number }[];
    tags: { id: string; name: string; count: number }[];
  }> {
    try {
      // Clean query
      const cleanQuery = this.sanitizeQuery(query);
      if (!cleanQuery) {
        return {
          contentTypes: [],
          categories: [],
          tags: []
        };
      }
      
      // Format query for tsquery
      const formattedQuery = this.formatQueryForTsQuery(cleanQuery);
      
      // Get content types
      const contentTypeQuery = `
        SELECT type, COUNT(*) as count
        FROM content
        WHERE status = 'active'
        AND search_vector @@ to_tsquery('english', $1)
        GROUP BY type
        ORDER BY count DESC
      `;
      
      const contentTypeResult = await this.db.query(contentTypeQuery, [formattedQuery]);
      
      // Get categories
      const categoryQuery = `
        SELECT 
          cat.id,
          cat.name,
          COUNT(c.id) as count
        FROM categories cat
        JOIN content c ON cat.id = c.category_id
        WHERE c.status = 'active'
        AND c.search_vector @@ to_tsquery('english', $1)
        GROUP BY cat.id, cat.name
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const categoryResult = await this.db.query(categoryQuery, [formattedQuery]);
      
      // Get tags
      const tagQuery = `
        SELECT 
          t.id,
          t.name,
          COUNT(ct.content_id) as count
        FROM tags t
        JOIN content_tags ct ON t.id = ct.tag_id
        JOIN content c ON ct.content_id = c.id
        WHERE c.status = 'active'
        AND c.search_vector @@ to_tsquery('english', $1)
        GROUP BY t.id, t.name
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const tagResult = await this.db.query(tagQuery, [formattedQuery]);
      
      return {
        contentTypes: contentTypeResult.rows.map(row => ({
          type: row.type,
          count: parseInt(row.count)
        })),
        categories: categoryResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          count: parseInt(row.count)
        })),
        tags: tagResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      logger.error('Error getting search filters', { error, query });
      return {
        contentTypes: [],
        categories: [],
        tags: []
      };
    }
  }

  /**
   * Track search query for analytics
   * 
   * @param query Search query
   * @param resultCount Number of results
   * @param hasFilters Whether filters were applied
   */
  private async trackSearchQuery(query: string, resultCount: number, hasFilters: boolean): Promise<void> {
    try {
      // Increment search query count
      await this.redis.zincrby('search:queries', 1, query.toLowerCase());
      
      // For popular queries, periodically persist to database
      if (await this.redis.zscore('search:queries', query.toLowerCase()) >= 5) {
        // This could be done asynchronously or batched
        await this.db.query(`
          INSERT INTO search_analytics (
            query,
            result_count,
            has_filters,
            search_count,
            last_searched_at
          ) VALUES ($1, $2, $3, 1, NOW())
          ON CONFLICT (query) DO UPDATE
          SET
            result_count = CASE WHEN search_analytics.result_count = $2 THEN search_analytics.result_count ELSE $2 END,
            search_count = search_analytics.search_count + 1,
            last_searched_at = NOW()
        `, [query.toLowerCase(), resultCount, hasFilters]);
      }
    } catch (error) {
      logger.error('Error tracking search query', { error, query });
      // Don't throw error for analytics tracking
    }
  }

  /**
   * Sanitize search query
   * 
   * @param query Raw search query
   * @returns Sanitized query
   */
  private sanitizeQuery(query: string): string {
    if (!query) return '';
    
    // Remove special characters and excessive whitespace
    return query
      .replace(/[^\w\s]/g, ' ') // Replace special chars with space
      .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Format query for tsquery
   * 
   * @param query Sanitized query
   * @returns Formatted query for tsquery
   */
  private formatQueryForTsQuery(query: string): string {
    if (!query) return '';
    
    // Split into words
    const words = query.split(' ');
    
    // Format for tsquery: word1:* & word2:* & ...
    return words
      .filter(word => word.length >= 3) // Filter out very short words
      .map(word => `${word}:*`)        // Add prefix search
      .join(' & ');                    // Join with AND operator
  }
}
