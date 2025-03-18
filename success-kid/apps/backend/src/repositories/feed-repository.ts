/**
 * Feed Repository
 * 
 * Specialized repository for efficient content feed generation with advanced
 * filtering, pagination, and sorting options.
 */
import { Pool } from 'pg';
import { logger } from '../lib/logger';
import { Content } from '../models/content';

export interface FeedOptions {
  limit?: number;
  lastId?: string;
  type?: string;
  status?: string;
  userId?: string;
  categoryId?: string;
  tags?: string[];
  sortBy?: 'recent' | 'popular' | 'trending';
  timeframe?: 'day' | 'week' | 'month' | 'all';
  includeCommentCounts?: boolean;
  includeReactionCounts?: boolean;
  includeUserDetails?: boolean;
}

/**
 * Repository for optimized feed queries
 */
export class FeedRepository {
  constructor(private db: Pool) {}
  
  /**
   * Get optimized content feed with keyset pagination and efficient sorting
   */
  async getContentFeed(options: FeedOptions = {}): Promise<any[]> {
    try {
      const { 
        limit = 20, 
        lastId, 
        type, 
        status = 'active', 
        userId, 
        categoryId,
        tags,
        sortBy = 'recent',
        timeframe = 'all',
        includeCommentCounts = true,
        includeReactionCounts = true,
        includeUserDetails = true
      } = options;
      
      // Calculate time range for queries
      let timeInterval: string;
      switch (timeframe) {
        case 'day': timeInterval = '1 day'; break;
        case 'week': timeInterval = '7 days'; break;
        case 'month': timeInterval = '30 days'; break;
        case 'all':
        default: timeInterval = '365 days'; break; // Default to a year for 'all'
      }

      // Build base query with efficient joins and optimized selection
      const selects = ['c.*'];
      const joins = [];
      const wheres = ['c.status = $1'];
      const queryParams: any[] = [status];
      let paramIndex = 2;
      
      // Add user details if requested
      if (includeUserDetails) {
        selects.push('u.display_name as author_name');
        selects.push('p.avatar_url as author_avatar');
        joins.push('JOIN users u ON c.user_id = u.id');
        joins.push('LEFT JOIN profiles p ON c.user_id = p.user_id');
      }
      
      // Add comment counts if requested
      if (includeCommentCounts) {
        selects.push(`
          COALESCE((
            SELECT COUNT(*) FROM comments 
            WHERE content_id = c.id AND status = 'active'
          ), 0) as comment_count
        `);
      }
      
      // Add reaction counts if requested
      if (includeReactionCounts) {
        selects.push(`
          COALESCE((
            SELECT COUNT(*) FROM content_reactions 
            WHERE content_id = c.id
          ), 0) as reaction_count
        `);
      }
      
      // Add trending score calculation for trending sorting
      if (sortBy === 'trending') {
        selects.push(`
          (
            COALESCE((
              SELECT COUNT(*) FROM content_reactions 
              WHERE content_id = c.id AND created_at > NOW() - INTERVAL '${timeInterval}'
            ), 0) * 1.0 +
            COALESCE((
              SELECT COUNT(*) FROM comments 
              WHERE content_id = c.id AND status = 'active' AND created_at > NOW() - INTERVAL '${timeInterval}'
            ), 0) * 3.0 +
            CASE WHEN c.created_at > NOW() - INTERVAL '1 day' THEN 5.0 ELSE 0.0 END
          ) as trending_score
        `);
      }
      
      // Filter by type if provided
      if (type) {
        wheres.push(`c.type = $${paramIndex}`);
        queryParams.push(type);
        paramIndex++;
      }
      
      // Filter by user if provided
      if (userId) {
        wheres.push(`c.user_id = $${paramIndex}`);
        queryParams.push(userId);
        paramIndex++;
      }
      
      // Filter by category if provided
      if (categoryId) {
        wheres.push(`c.category_id = $${paramIndex}`);
        queryParams.push(categoryId);
        paramIndex++;
      }
      
      // Apply time range filter for trending/popular
      if (sortBy === 'trending' || sortBy === 'popular') {
        wheres.push(`c.created_at > NOW() - INTERVAL '${timeInterval}'`);
      }
      
      // Implement keyset pagination for better performance
      if (lastId) {
        // Determine cursor field based on sort
        let cursorField = 'created_at';
        let cursorDirection = '<';
        
        if (sortBy === 'trending') {
          // For trending, we need to get the trending score of the last item first
          // Then use it for pagination
          wheres.push(`(
            (
              COALESCE((
                SELECT COUNT(*) FROM content_reactions 
                WHERE content_id = c.id AND created_at > NOW() - INTERVAL '${timeInterval}'
              ), 0) * 1.0 +
              COALESCE((
                SELECT COUNT(*) FROM comments 
                WHERE content_id = c.id AND status = 'active' AND created_at > NOW() - INTERVAL '${timeInterval}'
              ), 0) * 3.0 +
              CASE WHEN c.created_at > NOW() - INTERVAL '1 day' THEN 5.0 ELSE 0.0 END
            ) < (
              SELECT (
                COALESCE((
                  SELECT COUNT(*) FROM content_reactions 
                  WHERE content_id = $${paramIndex} AND created_at > NOW() - INTERVAL '${timeInterval}'
                ), 0) * 1.0 +
                COALESCE((
                  SELECT COUNT(*) FROM comments 
                  WHERE content_id = $${paramIndex} AND status = 'active' AND created_at > NOW() - INTERVAL '${timeInterval}'
                ), 0) * 3.0 +
                CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 5.0 ELSE 0.0 END
              ) FROM content WHERE id = $${paramIndex}
            )
            OR (
              (
                COALESCE((
                  SELECT COUNT(*) FROM content_reactions 
                  WHERE content_id = c.id AND created_at > NOW() - INTERVAL '${timeInterval}'
                ), 0) * 1.0 +
                COALESCE((
                  SELECT COUNT(*) FROM comments 
                  WHERE content_id = c.id AND status = 'active' AND created_at > NOW() - INTERVAL '${timeInterval}'
                ), 0) * 3.0 +
                CASE WHEN c.created_at > NOW() - INTERVAL '1 day' THEN 5.0 ELSE 0.0 END
              ) = (
                SELECT (
                  COALESCE((
                    SELECT COUNT(*) FROM content_reactions 
                    WHERE content_id = $${paramIndex} AND created_at > NOW() - INTERVAL '${timeInterval}'
                  ), 0) * 1.0 +
                  COALESCE((
                    SELECT COUNT(*) FROM comments 
                    WHERE content_id = $${paramIndex} AND status = 'active' AND created_at > NOW() - INTERVAL '${timeInterval}'
                  ), 0) * 3.0 +
                  CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 5.0 ELSE 0.0 END
                ) FROM content WHERE id = $${paramIndex}
              ) AND c.created_at < (SELECT created_at FROM content WHERE id = $${paramIndex})
            )
          )`);
        } else if (sortBy === 'popular') {
          // Similar approach for popular content using engagement metrics
          wheres.push(`(
            (COALESCE((
              SELECT COUNT(*) FROM comments 
              WHERE content_id = c.id AND status = 'active'
            ), 0) + COALESCE((
              SELECT COUNT(*) FROM content_reactions 
              WHERE content_id = c.id
            ), 0)) < (
              SELECT (COALESCE((
                SELECT COUNT(*) FROM comments 
                WHERE content_id = id AND status = 'active'
              ), 0) + COALESCE((
                SELECT COUNT(*) FROM content_reactions 
                WHERE content_id = id
              ), 0)) FROM content WHERE id = $${paramIndex}
            )
            OR (
              (COALESCE((
                SELECT COUNT(*) FROM comments 
                WHERE content_id = c.id AND status = 'active'
              ), 0) + COALESCE((
                SELECT COUNT(*) FROM content_reactions 
                WHERE content_id = c.id
              ), 0)) = (
                SELECT (COALESCE((
                  SELECT COUNT(*) FROM comments 
                  WHERE content_id = id AND status = 'active'
                ), 0) + COALESCE((
                  SELECT COUNT(*) FROM content_reactions 
                  WHERE content_id = id
                ), 0)) FROM content WHERE id = $${paramIndex}
              ) AND c.created_at < (SELECT created_at FROM content WHERE id = $${paramIndex})
            )
          )`);
        } else {
          // Simple time-based keyset pagination for recent
          wheres.push(`c.created_at < (SELECT created_at FROM content WHERE id = $${paramIndex})`);
        }
        
        queryParams.push(lastId);
        paramIndex++;
      }

      // Build tag filtering with JOIN if needed
      let tagJoin = '';
      if (tags && tags.length > 0) {
        const tagPlaceholders = tags.map((_, i) => `$${paramIndex + i}`).join(', ');
        tagJoin = `
          JOIN (
            SELECT content_id, COUNT(tag_id) as tag_match_count
            FROM content_tags
            WHERE tag_id IN (${tagPlaceholders})
            GROUP BY content_id
            HAVING COUNT(tag_id) = ${tags.length}
          ) tag_matches ON c.id = tag_matches.content_id
        `;
        
        queryParams.push(...tags);
        paramIndex += tags.length;
      }
      
      // Determine order by clause based on sort type
      let orderBy = '';
      switch (sortBy) {
        case 'popular':
          orderBy = `
            ORDER BY 
              (COALESCE((
                SELECT COUNT(*) FROM comments 
                WHERE content_id = c.id AND status = 'active'
              ), 0) + COALESCE((
                SELECT COUNT(*) FROM content_reactions 
                WHERE content_id = c.id
              ), 0)) DESC, 
              c.created_at DESC
          `;
          break;
        case 'trending':
          orderBy = `
            ORDER BY trending_score DESC, c.created_at DESC
          `;
          break;
        case 'recent':
        default:
          orderBy = `ORDER BY c.created_at DESC`;
          break;
      }
      
      // Complete the query
      const query = `
        SELECT ${selects.join(', ')}
        FROM content c
        ${joins.join('\n')}
        ${tagJoin}
        WHERE ${wheres.join(' AND ')}
        ${orderBy}
        LIMIT $${paramIndex}
      `;
      
      queryParams.push(limit);
      
      // Execute query
      const result = await this.db.query(query, queryParams);
      
      // Post-process to add engagement metrics, metadata, etc.
      return result.rows;
    } catch (error) {
      logger.error('Error getting optimized content feed', { error, options });
      throw error;
    }
  }
  
  /**
   * Get community feed with category highlights
   * Shows trending content from various categories in a balanced manner
   */
  async getCommunityFeed(options: { limit?: number; lastId?: string } = {}): Promise<any[]> {
    try {
      const { limit = 20, lastId } = options;
      
      // Get active categories
      const categoriesQuery = `
        SELECT id FROM categories WHERE is_active = true
      `;
      
      const categoriesResult = await this.db.query(categoriesQuery);
      const categories = categoriesResult.rows;
      
      if (categories.length === 0) {
        return [];
      }
      
      // Calculate items per category
      const itemsPerCategory = Math.max(1, Math.floor(limit / Math.min(categories.length, 5)));
      
      // Get feed items balanced across categories
      let allResults = [];
      
      for (let i = 0; i < Math.min(categories.length, 5); i++) {
        const categoryId = categories[i].id;
        
        // Get trending items from this category
        const feedOptions: FeedOptions = {
          limit: itemsPerCategory,
          categoryId,
          sortBy: 'trending',
          timeframe: 'week',
          lastId
        };
        
        const categoryItems = await this.getContentFeed(feedOptions);
        allResults = [...allResults, ...categoryItems];
      }
      
      // If we still need more items to reach the limit, get general trending content
      if (allResults.length < limit) {
        const remainingLimit = limit - allResults.length;
        
        const generalOptions: FeedOptions = {
          limit: remainingLimit,
          sortBy: 'trending',
          timeframe: 'week',
          lastId
        };
        
        const generalItems = await this.getContentFeed(generalOptions);
        
        // Filter out items we already have from categories
        const existingIds = new Set(allResults.map(item => item.id));
        const filteredItems = generalItems.filter(item => !existingIds.has(item.id));
        
        allResults = [...allResults, ...filteredItems.slice(0, remainingLimit)];
      }
      
      // Sort combined results by trending score
      allResults.sort((a, b) => {
        // If trending score is available, use it
        if (a.trending_score !== undefined && b.trending_score !== undefined) {
          return b.trending_score - a.trending_score;
        }
        
        // Otherwise fall back to recency
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Limit to requested number of items
      return allResults.slice(0, limit);
    } catch (error) {
      logger.error('Error getting community feed', { error, options });
      throw error;
    }
  }
  
  /**
   * Get personalized feed based on user interests and behavior
   */
  async getPersonalizedFeed(
    userId: string,
    options: { limit?: number; lastId?: string } = {}
  ): Promise<any[]> {
    try {
      const { limit = 20, lastId } = options;
      
      // This is a simplified implementation that combines:
      // 1. Content from categories the user has engaged with
      // 2. Content with tags the user has shown interest in
      // 3. Content from users the user follows (if applicable)
      // 4. Popular/trending content
      
      let results = [];
      const queryParams = [];
      let paramIndex = 1;
      
      // Get categories user has engaged with (through viewing, commenting, reacting)
      const userCategoriesQuery = `
        SELECT DISTINCT c.category_id
        FROM content c
        LEFT JOIN comments cm ON c.id = cm.content_id
        LEFT JOIN content_reactions cr ON c.id = cr.content_id
        WHERE 
          (c.user_id = $${paramIndex} OR cm.user_id = $${paramIndex} OR cr.user_id = $${paramIndex})
          AND c.category_id IS NOT NULL
        LIMIT 5
      `;
      
      queryParams.push(userId);
      
      const categoriesResult = await this.db.query(userCategoriesQuery, queryParams);
      const userCategories = categoriesResult.rows.map(row => row.category_id);
      
      // Get interest-based content (25% of feed)
      if (userCategories.length > 0) {
        const categoryPlaceholders = userCategories.map((_, i) => `$${paramIndex + i}`).join(', ');
        paramIndex += userCategories.length;
        
        const interestQuery = `
          SELECT c.*, u.display_name as author_name, p.avatar_url as author_avatar,
                 COALESCE((SELECT COUNT(*) FROM comments WHERE content_id = c.id AND status = 'active'), 0) as comment_count,
                 COALESCE((SELECT COUNT(*) FROM content_reactions WHERE content_id = c.id), 0) as reaction_count
          FROM content c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles p ON c.user_id = p.user_id
          WHERE c.status = 'active' 
            AND c.category_id IN (${categoryPlaceholders})
            ${lastId ? `AND c.created_at < (SELECT created_at FROM content WHERE id = $${paramIndex++})` : ''}
          ORDER BY c.created_at DESC
          LIMIT ${Math.floor(limit * 0.25)}
        `;
        
        const interestParams = [...queryParams, ...(lastId ? [lastId] : [])];
        const interestResult = await this.db.query(interestQuery, interestParams);
        results = [...results, ...interestResult.rows];
      }
      
      // Reset params for subsequent queries
      queryParams.length = 0;
      paramIndex = 1;
      queryParams.push(userId);
      
      // Get content from followed users (25% of feed)
      const followingQuery = `
        SELECT c.*, u.display_name as author_name, p.avatar_url as author_avatar,
               COALESCE((SELECT COUNT(*) FROM comments WHERE content_id = c.id AND status = 'active'), 0) as comment_count,
               COALESCE((SELECT COUNT(*) FROM content_reactions WHERE content_id = c.id), 0) as reaction_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        JOIN user_follows uf ON c.user_id = uf.followed_id
        WHERE c.status = 'active' 
          AND uf.follower_id = $1
          ${lastId ? `AND c.created_at < (SELECT created_at FROM content WHERE id = $2)` : ''}
        ORDER BY c.created_at DESC
        LIMIT ${Math.floor(limit * 0.25)}
      `;
      
      const followingParams = [userId, ...(lastId ? [lastId] : [])];
      const followingResult = await this.db.query(followingQuery, followingParams);
      
      // Add to results, avoiding duplicates
      const existingIds = new Set(results.map(item => item.id));
      for (const item of followingResult.rows) {
        if (!existingIds.has(item.id)) {
          results.push(item);
          existingIds.add(item.id);
        }
      }
      
      // Fill remaining with trending content
      const remainingLimit = limit - results.length;
      
      if (remainingLimit > 0) {
        const trendingOptions: FeedOptions = {
          limit: remainingLimit * 2, // Get more than needed to account for deduplication
          sortBy: 'trending',
          timeframe: 'week',
          lastId
        };
        
        const trendingItems = await this.getContentFeed(trendingOptions);
        
        // Add to results, avoiding duplicates
        for (const item of trendingItems) {
          if (!existingIds.has(item.id) && results.length < limit) {
            results.push(item);
            existingIds.add(item.id);
          }
          
          if (results.length >= limit) break;
        }
      }
      
      // Sort combined results, preferring recency
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return results;
    } catch (error) {
      logger.error('Error getting personalized feed', { error, userId, options });
      throw error;
    }
  }
  
  /**
   * Get content feed specifically optimized for mobile devices
   * With reduced payload size and optimized data structures
   */
  async getMobileFeed(options: FeedOptions = {}): Promise<any[]> {
    try {
      // Apply mobile-specific optimizations to the feed query
      const mobileFeed = await this.getContentFeed({
        ...options,
        // Optimize payload by limiting fields returned
        limit: options.limit || 10 // Mobile feeds typically show fewer items initially
      });
      
      // Transform results for mobile optimizations
      return mobileFeed.map(item => ({
        id: item.id,
        user_id: item.user_id,
        type: item.type,
        // Truncate content text for previews
        content_text: item.content_text ? item.content_text.substring(0, 150) : null,
        // Include only first media URL if available
        media_preview: item.media_urls && item.media_urls.length > 0 ? 
          item.media_urls[0] : null,
        media_count: item.media_urls ? item.media_urls.length : 0,
        created_at: item.created_at,
        author_name: item.author_name,
        author_avatar: item.author_avatar,
        comment_count: item.comment_count || 0,
        reaction_count: item.reaction_count || 0
      }));
    } catch (error) {
      logger.error('Error getting mobile feed', { error, options });
      throw error;
    }
  }
}
