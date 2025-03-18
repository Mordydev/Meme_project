/**
 * Search Service
 * 
 * Service for advanced search functionality across content, users, and forums
 */
import { Pool } from 'pg';
import { ContentRepository } from '../../repositories/content-repository';
import { UserRepository } from '../../repositories/user-repository';
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { logger } from '../../lib/logger';

export interface SearchOptions {
  query: string;
  type?: 'content' | 'user' | 'comment' | 'all';
  categoryId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  timeframe?: 'day' | 'week' | 'month' | 'all';
  sortBy?: 'relevance' | 'recent' | 'popular';
}

interface SearchResult {
  type: 'content' | 'user' | 'comment';
  id: string;
  title?: string;
  text: string;
  preview: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: Date;
  url: string;
  matchFields: string[];
  highlights: { field: string; text: string; matches: [number, number][] }[];
}

export class SearchService {
  constructor(
    private db: Pool,
    private contentRepository: ContentRepository,
    private userRepository: UserRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository,
    private commentRepository: CommentRepository
  ) {}
  
  /**
   * Perform a search across multiple content types
   */
  async search(options: SearchOptions): Promise<{
    results: SearchResult[];
    totalResults: number;
    categories?: any[];
    tags?: any[];
    facets?: any;
  }> {
    try {
      const { 
        query, 
        type = 'all', 
        categoryId, 
        tags, 
        limit = 20, 
        offset = 0,
        timeframe = 'all',
        sortBy = 'relevance'
      } = options;
      
      if (!query || query.trim().length === 0) {
        return { results: [], totalResults: 0 };
      }
      
      // Normalize query for better matching
      const normalizedQuery = query.trim().toLowerCase();
      
      // Build search promises based on requested types
      const searchPromises: Promise<any[]>[] = [];
      const countPromises: Promise<number>[] = [];
      
      if (type === 'all' || type === 'content') {
        searchPromises.push(this.searchContent(normalizedQuery, {
          categoryId,
          tags,
          limit: type === 'all' ? Math.floor(limit * 0.6) : limit,
          offset,
          timeframe,
          sortBy
        }));
        countPromises.push(this.countContentResults(normalizedQuery, {
          categoryId,
          tags,
          timeframe
        }));
      }
      
      if (type === 'all' || type === 'user') {
        searchPromises.push(this.searchUsers(normalizedQuery, {
          limit: type === 'all' ? Math.floor(limit * 0.2) : limit,
          offset
        }));
        countPromises.push(this.countUserResults(normalizedQuery));
      }
      
      if (type === 'all' || type === 'comment') {
        searchPromises.push(this.searchComments(normalizedQuery, {
          categoryId,
          limit: type === 'all' ? Math.floor(limit * 0.2) : limit,
          offset,
          timeframe
        }));
        countPromises.push(this.countCommentResults(normalizedQuery, {
          categoryId,
          timeframe
        }));
      }
      
      // Execute all searches in parallel
      const [searchResults, countResults] = await Promise.all([
        Promise.all(searchPromises),
        Promise.all(countPromises)
      ]);
      
      // Flatten and combine results
      let combinedResults: SearchResult[] = [];
      searchResults.forEach(resultSet => {
        combinedResults = [...combinedResults, ...resultSet];
      });
      
      // Sort combined results
      if (sortBy === 'recent') {
        combinedResults.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else if (sortBy === 'relevance') {
        // Results are already sorted by relevance within their respective searches
        // But we could apply additional relevance sorting here if needed
      }
      
      // Calculate total counts
      const totalResults = countResults.reduce((sum, count) => sum + count, 0);
      
      // Get facets for filtering
      const facets = await this.getSearchFacets(normalizedQuery);
      
      return {
        results: combinedResults.slice(0, limit),
        totalResults,
        facets
      };
    } catch (error) {
      logger.error('Error performing search', { error, options });
      throw error;
    }
  }
  
  /**
   * Search content items (posts, threads, etc.)
   */
  private async searchContent(
    query: string,
    options: {
      categoryId?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
      timeframe?: string;
      sortBy?: string;
    }
  ): Promise<SearchResult[]> {
    try {
      const { 
        categoryId, 
        tags, 
        limit = 20, 
        offset = 0,
        timeframe = 'all',
        sortBy = 'relevance'
      } = options;
      
      // Calculate time interval
      let timeInterval: string;
      switch (timeframe) {
        case 'day': timeInterval = '1 day'; break;
        case 'week': timeInterval = '7 days'; break;
        case 'month': timeInterval = '30 days'; break;
        case 'all':
        default: timeInterval = '10 years'; break; // Very large interval
      }
      
      // Build query
      let sqlQuery = `
        SELECT 
          c.id,
          c.type,
          c.content_text,
          c.media_urls,
          c.created_at,
          c.user_id,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.category_id,
          -- Calculate relevance score
          (
            CASE 
              WHEN c.content_text ILIKE $1 THEN 10 -- Exact match
              WHEN c.content_text ILIKE $2 THEN 5 -- Starts with
              WHEN c.content_text ILIKE $3 THEN 3 -- Contains
              ELSE 1
            END +
            CASE WHEN u.display_name ILIKE $3 THEN 2 ELSE 0 END -- Author name boost
          ) as relevance_score
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        WHERE 
          c.status = 'active' AND
          (
            c.content_text ILIKE $3 OR
            u.display_name ILIKE $3
          )
      `;
      
      const queryParams: any[] = [
        query, // Exact match
        `${query}%`, // Starts with
        `%${query}%` // Contains
      ];
      
      let paramIndex = 4;
      
      // Add category filter if provided
      if (categoryId) {
        sqlQuery += ` AND c.category_id = $${paramIndex++}`;
        queryParams.push(categoryId);
      }
      
      // Add timeframe filter
      sqlQuery += ` AND c.created_at > NOW() - INTERVAL '${timeInterval}'`;
      
      // Add tag filtering if provided
      if (tags && tags.length > 0) {
        sqlQuery += `
          AND c.id IN (
            SELECT content_id FROM content_tags
            WHERE tag_id IN (${tags.map((_, i) => `$${paramIndex + i}`).join(', ')})
            GROUP BY content_id
            HAVING COUNT(DISTINCT tag_id) = ${tags.length}
          )
        `;
        queryParams.push(...tags);
        paramIndex += tags.length;
      }
      
      // Add sorting
      if (sortBy === 'recent') {
        sqlQuery += ` ORDER BY c.created_at DESC`;
      } else if (sortBy === 'popular') {
        sqlQuery += `
          ORDER BY (
            SELECT COUNT(*) FROM comments WHERE content_id = c.id AND status = 'active'
          ) + (
            SELECT COUNT(*) FROM content_reactions WHERE content_id = c.id
          ) DESC,
          c.created_at DESC
        `;
      } else {
        // Default to relevance
        sqlQuery += ` ORDER BY relevance_score DESC, c.created_at DESC`;
      }
      
      // Add pagination
      sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      // Execute query
      const result = await this.db.query(sqlQuery, queryParams);
      
      // Process results into search result format
      return result.rows.map(row => {
        // Try to extract title for thread-type content
        let title = '';
        let textContent = row.content_text || '';
        
        try {
          const contentData = JSON.parse(row.content_text || '{}');
          if (contentData.title) {
            title = contentData.title;
            textContent = contentData.content || '';
          }
        } catch (e) {
          // Not JSON format, use as-is
        }
        
        // Create preview with highlighted match
        const previewText = textContent.substring(0, 200);
        const matchIndex = previewText.toLowerCase().indexOf(query.toLowerCase());
        
        let preview = previewText;
        const matches: [number, number][] = [];
        
        if (matchIndex >= 0) {
          matches.push([matchIndex, matchIndex + query.length]);
        }
        
        return {
          type: 'content',
          id: row.id,
          title: title || null,
          text: textContent,
          preview: preview + (textContent.length > 200 ? '...' : ''),
          authorId: row.user_id,
          authorName: row.author_name,
          authorAvatar: row.author_avatar,
          createdAt: row.created_at,
          url: `/content/${row.id}`,
          matchFields: ['content'],
          highlights: [
            {
              field: 'content',
              text: preview,
              matches
            }
          ]
        };
      });
    } catch (error) {
      logger.error('Error searching content', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Search users
   */
  private async searchUsers(
    query: string,
    options: { limit?: number; offset?: number }
  ): Promise<SearchResult[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const sqlQuery = `
        SELECT 
          u.id,
          u.display_name,
          p.bio,
          p.avatar_url,
          u.created_at,
          -- Calculate relevance score
          CASE 
            WHEN u.display_name ILIKE $1 THEN 10 -- Exact match
            WHEN u.display_name ILIKE $2 THEN 7 -- Starts with
            WHEN u.display_name ILIKE $3 THEN 5 -- Contains
            WHEN p.bio ILIKE $3 THEN 3 -- Bio contains
            ELSE 1
          END as relevance_score
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE 
          u.status = 'active' AND
          (
            u.display_name ILIKE $3 OR
            p.bio ILIKE $3
          )
        ORDER BY relevance_score DESC, u.created_at DESC
        LIMIT $4 OFFSET $5
      `;
      
      const result = await this.db.query(sqlQuery, [
        query, // Exact match
        `${query}%`, // Starts with
        `%${query}%`, // Contains
        limit,
        offset
      ]);
      
      // Process results into search result format
      return result.rows.map(row => {
        const bioText = row.bio || '';
        const matchIndex = bioText.toLowerCase().indexOf(query.toLowerCase());
        
        // Create preview with context around match in bio
        let preview = '';
        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(bioText.length, matchIndex + query.length + 50);
          preview = (start > 0 ? '...' : '') + 
                    bioText.substring(start, end) + 
                    (end < bioText.length ? '...' : '');
        } else {
          preview = bioText.substring(0, 100) + (bioText.length > 100 ? '...' : '');
        }
        
        return {
          type: 'user',
          id: row.id,
          title: row.display_name,
          text: bioText,
          preview,
          authorId: row.id,
          authorName: row.display_name,
          authorAvatar: row.avatar_url,
          createdAt: row.created_at,
          url: `/profile/${row.id}`,
          matchFields: [
            row.display_name.toLowerCase().includes(query.toLowerCase()) ? 'name' : null,
            bioText.toLowerCase().includes(query.toLowerCase()) ? 'bio' : null
          ].filter(Boolean) as string[],
          highlights: [
            {
              field: 'name',
              text: row.display_name,
              matches: row.display_name.toLowerCase().includes(query.toLowerCase()) ? 
                [[row.display_name.toLowerCase().indexOf(query.toLowerCase()), 
                  row.display_name.toLowerCase().indexOf(query.toLowerCase()) + query.length]] : 
                []
            }
          ]
        };
      });
    } catch (error) {
      logger.error('Error searching users', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Search comments
   */
  private async searchComments(
    query: string,
    options: {
      categoryId?: string;
      limit?: number;
      offset?: number;
      timeframe?: string;
    }
  ): Promise<SearchResult[]> {
    try {
      const { 
        categoryId, 
        limit = 20, 
        offset = 0,
        timeframe = 'all'
      } = options;
      
      // Calculate time interval
      let timeInterval: string;
      switch (timeframe) {
        case 'day': timeInterval = '1 day'; break;
        case 'week': timeInterval = '7 days'; break;
        case 'month': timeInterval = '30 days'; break;
        case 'all':
        default: timeInterval = '10 years'; break; // Very large interval
      }
      
      // Build query
      let sqlQuery = `
        SELECT 
          cm.id,
          cm.comment_text,
          cm.created_at,
          cm.content_id,
          cm.user_id,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.category_id,
          -- Calculate relevance score
          CASE 
            WHEN cm.comment_text ILIKE $1 THEN 10 -- Exact match
            WHEN cm.comment_text ILIKE $2 THEN 5 -- Starts with
            WHEN cm.comment_text ILIKE $3 THEN 3 -- Contains
            ELSE 1
          END as relevance_score
        FROM comments cm
        JOIN content c ON cm.content_id = c.id
        JOIN users u ON cm.user_id = u.id
        LEFT JOIN profiles p ON cm.user_id = p.user_id
        WHERE 
          cm.status = 'active' AND
          c.status = 'active' AND
          cm.comment_text ILIKE $3
      `;
      
      const queryParams: any[] = [
        query, // Exact match
        `${query}%`, // Starts with
        `%${query}%` // Contains
      ];
      
      let paramIndex = 4;
      
      // Add category filter if provided
      if (categoryId) {
        sqlQuery += ` AND c.category_id = $${paramIndex++}`;
        queryParams.push(categoryId);
      }
      
      // Add timeframe filter
      sqlQuery += ` AND cm.created_at > NOW() - INTERVAL '${timeInterval}'`;
      
      // Add sorting and pagination
      sqlQuery += `
        ORDER BY relevance_score DESC, cm.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      queryParams.push(limit, offset);
      
      // Execute query
      const result = await this.db.query(sqlQuery, queryParams);
      
      // Process results into search result format
      return result.rows.map(row => {
        const commentText = row.comment_text || '';
        const matchIndex = commentText.toLowerCase().indexOf(query.toLowerCase());
        
        // Create preview with context around match
        let preview = '';
        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(commentText.length, matchIndex + query.length + 50);
          preview = (start > 0 ? '...' : '') + 
                    commentText.substring(start, end) + 
                    (end < commentText.length ? '...' : '');
        } else {
          preview = commentText.substring(0, 100) + (commentText.length > 100 ? '...' : '');
        }
        
        return {
          type: 'comment',
          id: row.id,
          title: `Comment on content ${row.content_id}`,
          text: commentText,
          preview,
          authorId: row.user_id,
          authorName: row.author_name,
          authorAvatar: row.author_avatar,
          createdAt: row.created_at,
          url: `/content/${row.content_id}?comment=${row.id}`,
          matchFields: ['comment'],
          highlights: [
            {
              field: 'comment',
              text: preview,
              matches: matchIndex >= 0 ? 
                [[matchIndex, matchIndex + query.length]] : 
                []
            }
          ]
        };
      });
    } catch (error) {
      logger.error('Error searching comments', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Count content search results for pagination
   */
  private async countContentResults(
    query: string,
    options: {
      categoryId?: string;
      tags?: string[];
      timeframe?: string;
    }
  ): Promise<number> {
    try {
      const { categoryId, tags, timeframe = 'all' } = options;
      
      // Calculate time interval
      let timeInterval: string;
      switch (timeframe) {
        case 'day': timeInterval = '1 day'; break;
        case 'week': timeInterval = '7 days'; break;
        case 'month': timeInterval = '30 days'; break;
        case 'all':
        default: timeInterval = '10 years'; break;
      }
      
      // Build query
      let sqlQuery = `
        SELECT COUNT(*) as count
        FROM content c
        JOIN users u ON c.user_id = u.id
        WHERE 
          c.status = 'active' AND
          (
            c.content_text ILIKE $1 OR
            u.display_name ILIKE $1
          )
      `;
      
      const queryParams: any[] = [`%${query}%`];
      let paramIndex = 2;
      
      // Add category filter if provided
      if (categoryId) {
        sqlQuery += ` AND c.category_id = $${paramIndex++}`;
        queryParams.push(categoryId);
      }
      
      // Add timeframe filter
      sqlQuery += ` AND c.created_at > NOW() - INTERVAL '${timeInterval}'`;
      
      // Add tag filtering if provided
      if (tags && tags.length > 0) {
        sqlQuery += `
          AND c.id IN (
            SELECT content_id FROM content_tags
            WHERE tag_id IN (${tags.map((_, i) => `$${paramIndex + i}`).join(', ')})
            GROUP BY content_id
            HAVING COUNT(DISTINCT tag_id) = ${tags.length}
          )
        `;
        queryParams.push(...tags);
      }
      
      // Execute query
      const result = await this.db.query<{ count: string }>(sqlQuery, queryParams);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting content search results', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Count user search results for pagination
   */
  private async countUserResults(query: string): Promise<number> {
    try {
      const sqlQuery = `
        SELECT COUNT(*) as count
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE 
          u.status = 'active' AND
          (
            u.display_name ILIKE $1 OR
            p.bio ILIKE $1
          )
      `;
      
      const result = await this.db.query<{ count: string }>(sqlQuery, [`%${query}%`]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting user search results', { error, query });
      throw error;
    }
  }
  
  /**
   * Count comment search results for pagination
   */
  private async countCommentResults(
    query: string,
    options: {
      categoryId?: string;
      timeframe?: string;
    }
  ): Promise<number> {
    try {
      const { categoryId, timeframe = 'all' } = options;
      
      // Calculate time interval
      let timeInterval: string;
      switch (timeframe) {
        case 'day': timeInterval = '1 day'; break;
        case 'week': timeInterval = '7 days'; break;
        case 'month': timeInterval = '30 days'; break;
        case 'all':
        default: timeInterval = '10 years'; break;
      }
      
      // Build query
      let sqlQuery = `
        SELECT COUNT(*) as count
        FROM comments cm
        JOIN content c ON cm.content_id = c.id
        WHERE 
          cm.status = 'active' AND
          c.status = 'active' AND
          cm.comment_text ILIKE $1
      `;
      
      const queryParams: any[] = [`%${query}%`];
      let paramIndex = 2;
      
      // Add category filter if provided
      if (categoryId) {
        sqlQuery += ` AND c.category_id = $${paramIndex++}`;
        queryParams.push(categoryId);
      }
      
      // Add timeframe filter
      sqlQuery += ` AND cm.created_at > NOW() - INTERVAL '${timeInterval}'`;
      
      // Execute query
      const result = await this.db.query<{ count: string }>(sqlQuery, queryParams);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting comment search results', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Get search facets for filtering
   */
  private async getSearchFacets(query: string): Promise<any> {
    try {
      // Get categories with matching content
      const categoriesQuery = `
        SELECT 
          cat.id, 
          cat.name, 
          cat.slug,
          COUNT(DISTINCT c.id) as count
        FROM categories cat
        JOIN content c ON c.category_id = cat.id
        WHERE 
          c.status = 'active' AND
          (
            c.content_text ILIKE $1 OR
            EXISTS (
              SELECT 1 FROM users u
              WHERE u.id = c.user_id AND u.display_name ILIKE $1
            )
          )
        GROUP BY cat.id, cat.name, cat.slug
        HAVING COUNT(DISTINCT c.id) > 0
        ORDER BY count DESC
      `;
      
      // Get matching tags
      const tagsQuery = `
        SELECT 
          t.id, 
          t.name, 
          t.slug,
          COUNT(DISTINCT ct.content_id) as count
        FROM tags t
        JOIN content_tags ct ON t.id = ct.tag_id
        JOIN content c ON ct.content_id = c.id
        WHERE 
          c.status = 'active' AND
          (
            c.content_text ILIKE $1 OR
            EXISTS (
              SELECT 1 FROM users u
              WHERE u.id = c.user_id AND u.display_name ILIKE $1
            )
          )
        GROUP BY t.id, t.name, t.slug
        HAVING COUNT(DISTINCT ct.content_id) > 0
        ORDER BY count DESC
        LIMIT 10
      `;
      
      // Execute queries in parallel
      const [categoriesResult, tagsResult] = await Promise.all([
        this.db.query(categoriesQuery, [`%${query}%`]),
        this.db.query(tagsQuery, [`%${query}%`])
      ]);
      
      return {
        categories: categoriesResult.rows,
        tags: tagsResult.rows
      };
    } catch (error) {
      logger.error('Error getting search facets', { error, query });
      return { categories: [], tags: [] };
    }
  }
}
