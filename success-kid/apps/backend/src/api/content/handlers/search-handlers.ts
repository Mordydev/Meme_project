/**
 * Search API Handlers
 * 
 * Handlers for advanced search API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { validate } from '../../../middleware/validation';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

// Request validation schemas
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['content', 'user', 'comment', 'all']).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'all']).optional(),
  sortBy: z.enum(['relevance', 'recent', 'popular']).optional()
});

/**
 * Perform advanced search
 */
export async function advancedSearch(
  request: FastifyRequest<{ Querystring: z.infer<typeof searchQuerySchema> }>,
  reply: FastifyReply
) {
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
    } = request.query;
    
    // Validate query presence
    if (!query || query.trim().length === 0) {
      return reply.code(400).send({
        error: 'Search query is required'
      });
    }
    
    const searchService = request.diContainer.resolve('services').searchService;
    
    const results = await searchService.search({
      query,
      type,
      categoryId,
      tags,
      limit,
      offset,
      timeframe,
      sortBy
    });
    
    return reply.send({
      data: results.results,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query,
        totalResults: results.totalResults,
        hasMore: results.results.length === limit && offset + limit < results.totalResults
      },
      facets: results.facets
    });
  } catch (error) {
    logger.error('Error performing advanced search', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  request: FastifyRequest<{ Querystring: { query: string, limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { query, limit = '5' } = request.query;
    const suggestionLimit = parseInt(limit, 10) || 5;
    
    if (!query || query.length < 2) {
      return reply.send({
        data: [],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Get database repositories
    const db = request.diContainer.resolve('db');
    const contentRepo = db.repositories.content;
    const userRepo = db.repositories.users;
    const tagRepo = db.repositories.tags;
    
    // Run queries in parallel for efficiency
    const [contentResults, userResults, tagResults] = await Promise.all([
      // Search content titles (extracted from content_text)
      contentRepo.searchContent(query, { limit: suggestionLimit }),
      
      // Search user display names
      userRepo.searchByDisplayName(query, suggestionLimit),
      
      // Search tags
      tagRepo.searchTags(query, suggestionLimit)
    ]);
    
    // Process content results to extract titles
    const contentSuggestions = contentResults.map(content => {
      let title = '';
      try {
        const data = JSON.parse(content.content_text || '{}');
        title = data.title || '';
      } catch (e) {
        // Not a JSON format, use content preview
        title = content.content_text ? 
          content.content_text.substring(0, 50) : 
          `Content #${content.id}`;
      }
      
      return {
        type: 'content',
        id: content.id,
        text: title,
        url: `/content/${content.id}`
      };
    }).filter(item => item.text); // Only include items with text
    
    // Process user results
    const userSuggestions = userResults.map(user => ({
      type: 'user',
      id: user.id,
      text: user.display_name,
      url: `/profile/${user.id}`
    }));
    
    // Process tag results
    const tagSuggestions = tagResults.map(tag => ({
      type: 'tag',
      id: tag.id,
      text: tag.name,
      url: `/explore/tag/${tag.slug}`
    }));
    
    // Combine and limit results
    const combinedSuggestions = [
      ...contentSuggestions, 
      ...userSuggestions,
      ...tagSuggestions
    ].sort((a, b) => {
      // Sort by relevance - exact matches first, then starts with, then contains
      const aLower = a.text.toLowerCase();
      const bLower = b.text.toLowerCase();
      const queryLower = query.toLowerCase();
      
      const aExact = aLower === queryLower;
      const bExact = bLower === queryLower;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = aLower.startsWith(queryLower);
      const bStarts = bLower.startsWith(queryLower);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    }).slice(0, suggestionLimit);
    
    return reply.send({
      data: combinedSuggestions,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query
      }
    });
  } catch (error) {
    logger.error('Error getting search suggestions', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Get trending search terms
 */
export async function getTrendingSearchTerms(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // In a real implementation, this would come from a search analytics service
    // For now, return hardcoded trending terms as a placeholder
    const trendingTerms = [
      { term: "Success Kid Token", count: 152 },
      { term: "Price Analysis", count: 98 },
      { term: "How to earn points", count: 87 },
      { term: "Market Cap", count: 65 },
      { term: "Redemption Guide", count: 43 }
    ];
    
    return reply.send({
      data: trendingTerms,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting trending search terms', { error });
    throw error;
  }
}
