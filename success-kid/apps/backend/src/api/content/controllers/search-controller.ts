/**
 * Search Controller
 * 
 * Handles API endpoints for content search
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SearchService } from '../../../services/content/search/search-service';
import { logger } from '../../../lib/logger';
import { handleApiError } from '../../../errors/handlers';

// Search query schema
const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  contentType: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

// Suggestion query schema
const suggestionQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5)
});

/**
 * Search content
 */
export const searchContent = (searchService: SearchService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query params
      const query = searchQuerySchema.parse(request.query);
      
      // Build filter object
      const filter = {
        contentType: query.contentType,
        categoryId: query.categoryId,
        tagId: query.tagId,
        userId: query.userId,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined
      };
      
      // Search content
      const searchResults = await searchService.searchContent(
        query.q,
        filter,
        query.limit,
        query.offset
      );
      
      // Get filter options for the search query
      const filterOptions = await searchService.getSearchFilters(query.q);
      
      // Return search results
      return reply.code(200).send({
        data: searchResults,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          query: query.q,
          totalResults: searchResults.length,
          filters: filterOptions
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          nextOffset: query.offset + searchResults.length
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get search suggestions
 */
export const getSearchSuggestions = (searchService: SearchService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query params
      const query = suggestionQuerySchema.parse(request.query);
      
      // Get suggestions
      const suggestions = await searchService.getSuggestions(query.q, query.limit);
      
      // Return suggestions
      return reply.code(200).send({
        data: suggestions,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          query: query.q
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};
