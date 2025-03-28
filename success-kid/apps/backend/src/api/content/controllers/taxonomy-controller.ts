/**
 * Taxonomy Controller
 * 
 * Handles API endpoints for categories and tags
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TaxonomyService } from '../../../services/taxonomy/taxonomy-service';
import { 
  createCategorySchema, 
  updateCategorySchema
} from '../../../models/entities/taxonomy/category.model';
import { 
  createTagSchema, 
  updateTagSchema
} from '../../../models/entities/taxonomy/tag.model';
import { ContentService } from '../../../services/content/content-service';
import { logger } from '../../../lib/logger';
import { handleApiError } from '../../../errors/handlers';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../errors';

// Query params schema for tags
const tagsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

/**
 * Get all categories
 */
export const getCategories = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get categories in hierarchical structure
      const categories = await taxonomyService.getCategoryHierarchy();
      
      // Return categories
      return reply.code(200).send({
        data: categories,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get category by ID
 */
export const getCategoryById = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Get category
      const category = await taxonomyService.getCategoryById(id);
      
      if (!category) {
        throw new NotFoundError('Category', id);
      }
      
      // Return category
      return reply.code(200).send({
        data: category,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      
      // Get category
      const category = await taxonomyService.getCategoryBySlug(slug);
      
      if (!category) {
        throw new NotFoundError('Category', `with slug '${slug}'`);
      }
      
      // Return category
      return reply.code(200).send({
        data: category,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Create category (admin only)
 */
export const createCategory = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user is admin
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Only administrators can create categories');
      }
      
      // Validate request body
      const data = createCategorySchema.parse(request.body);
      
      // Create category
      const category = await taxonomyService.createCategory(data);
      
      // Return created category
      return reply.code(201).send({
        data: category,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Update category (admin only)
 */
export const updateCategory = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is admin
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Only administrators can update categories');
      }
      
      // Validate request body
      const data = updateCategorySchema.parse(request.body);
      
      // Update category
      const category = await taxonomyService.updateCategory(id, data);
      
      if (!category) {
        throw new NotFoundError('Category', id);
      }
      
      // Return updated category
      return reply.code(200).send({
        data: category,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Delete category (admin only)
 */
export const deleteCategory = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is admin
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Only administrators can delete categories');
      }
      
      // Delete category
      const deleted = await taxonomyService.deleteCategory(id);
      
      if (!deleted) {
        throw new NotFoundError('Category', id);
      }
      
      // Return success
      return reply.code(200).send({
        data: { success: true },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get content for category
 */
export const getCategoryContent = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Parse query params
      const query = z.object({
        limit: z.coerce.number().int().min(1).max(50).default(20),
        lastId: z.string().optional(),
        lastCreatedAt: z.string().optional(),
        type: z.string().optional()
      }).parse(request.query);
      
      // Get content
      const contentItems = await contentService.getContentByCategory(id, {
        limit: query.limit,
        lastId: query.lastId,
        lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined,
        type: query.type
      });
      
      // Return content
      return reply.code(200).send({
        data: contentItems,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          categoryId: id
        },
        pagination: {
          lastId: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null,
          lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].created_at.toISOString() : null,
          limit: query.limit,
          hasMore: contentItems.length === query.limit
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get popular tags
 */
export const getPopularTags = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse query params
      const query = tagsQuerySchema.parse(request.query);
      
      // Get popular tags
      const tags = await taxonomyService.getPopularTags(query.limit);
      
      // Return tags
      return reply.code(200).send({
        data: tags,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get tag by ID
 */
export const getTagById = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Get tag
      const tag = await taxonomyService.getTagById(id);
      
      if (!tag) {
        throw new NotFoundError('Tag', id);
      }
      
      // Return tag
      return reply.code(200).send({
        data: tag,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get tag by slug
 */
export const getTagBySlug = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      
      // Get tag
      const tag = await taxonomyService.getTagBySlug(slug);
      
      if (!tag) {
        throw new NotFoundError('Tag', `with slug '${slug}'`);
      }
      
      // Return tag
      return reply.code(200).send({
        data: tag,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get content for tag
 */
export const getTagContent = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      
      // Parse query params
      const query = z.object({
        limit: z.coerce.number().int().min(1).max(50).default(20),
        lastId: z.string().optional(),
        lastCreatedAt: z.string().optional(),
        type: z.string().optional()
      }).parse(request.query);
      
      // Get content
      const contentItems = await contentService.getContentByTag(slug, {
        limit: query.limit,
        lastId: query.lastId,
        lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined,
        type: query.type
      });
      
      // Return content
      return reply.code(200).send({
        data: contentItems,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          tagSlug: slug
        },
        pagination: {
          lastId: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null,
          lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].created_at.toISOString() : null,
          limit: query.limit,
          hasMore: contentItems.length === query.limit
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Create tag (admin only)
 */
export const createTag = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user is admin
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Only administrators can create tags');
      }
      
      // Validate request body
      const data = createTagSchema.parse(request.body);
      
      // Create tag
      const tag = await taxonomyService.createTag(data);
      
      // Return created tag
      return reply.code(201).send({
        data: tag,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Update tag (admin only)
 */
export const updateTag = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is admin
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Only administrators can update tags');
      }
      
      // Validate request body
      const data = updateTagSchema.parse(request.body);
      
      // Update tag
      const tag = await taxonomyService.updateTag(id, data);
      
      if (!tag) {
        throw new NotFoundError('Tag', id);
      }
      
      // Return updated tag
      return reply.code(200).send({
        data: tag,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Delete tag (admin only)
 */
export const deleteTag = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is admin
      if (!request.user.isAdmin) {
        throw new ForbiddenError('Only administrators can delete tags');
      }
      
      // Delete tag
      const deleted = await taxonomyService.deleteTag(id);
      
      if (!deleted) {
        throw new NotFoundError('Tag', id);
      }
      
      // Return success
      return reply.code(200).send({
        data: { success: true },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get content tags
 */
export const getContentTags = (taxonomyService: TaxonomyService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Get tags
      const tags = await taxonomyService.getContentTags(id);
      
      // Return tags
      return reply.code(200).send({
        data: tags,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          contentId: id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};
