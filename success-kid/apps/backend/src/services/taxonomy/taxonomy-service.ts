/**
 * Taxonomy Service
 * 
 * Handles management of categories and tags for content organization
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { 
  Category, 
  CreateCategoryDto, 
  UpdateCategoryDto,
  CategoryWithChildren
} from '../../models/entities/taxonomy/category.model';
import {
  Tag,
  CreateTagDto,
  UpdateTagDto,
  TagWithCount
} from '../../models/entities/taxonomy/tag.model';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError 
} from '../../errors';

/**
 * Service for managing taxonomy (categories and tags)
 */
export class TaxonomyService {
  /**
   * Create a new TaxonomyService
   * 
   * @param categoryRepository Repository for category data
   * @param tagRepository Repository for tag data
   */
  constructor(
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository
  ) {}

  /**
   * Create a new category
   * 
   * @param data Category data
   * @returns Created category
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      // Check if slug is already in use
      const existingCategory = await this.categoryRepository.getCategoryBySlug(data.slug);
      if (existingCategory) {
        throw new ConflictError(`Category with slug '${data.slug}' already exists`);
      }

      // Check if parent category exists if provided
      if (data.parent_id) {
        const parentCategory = await this.categoryRepository.findById(data.parent_id);
        if (!parentCategory) {
          throw new NotFoundError('Parent category', data.parent_id);
        }
      }

      // Create the category
      const category = await this.categoryRepository.createCategory({
        ...data,
        id: uuidv4()
      });
      
      logger.info(`Created new category: ${category.name} (${category.id})`);
      return category;
    } catch (error) {
      logger.error('Error creating category', { error, data });
      // Re-throw known errors
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  /**
   * Update a category
   * 
   * @param categoryId Category ID
   * @param data Category data to update
   * @returns Updated category
   */
  async updateCategory(categoryId: string, data: UpdateCategoryDto): Promise<Category | null> {
    try {
      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(categoryId);
      if (!existingCategory) {
        throw new NotFoundError('Category', categoryId);
      }

      // Check if slug is already in use by another category
      if (data.slug && data.slug !== existingCategory.slug) {
        const categoryWithSlug = await this.categoryRepository.getCategoryBySlug(data.slug);
        if (categoryWithSlug && categoryWithSlug.id !== categoryId) {
          throw new ConflictError(`Category with slug '${data.slug}' already exists`);
        }
      }

      // Check if parent category exists if provided and ensure no circular reference
      if (data.parent_id) {
        // Can't set self as parent
        if (data.parent_id === categoryId) {
          throw new ValidationError('Category cannot be its own parent');
        }

        const parentCategory = await this.categoryRepository.findById(data.parent_id);
        if (!parentCategory) {
          throw new NotFoundError('Parent category', data.parent_id);
        }

        // Check for circular references (would need recursive check for deeper nesting)
        if (parentCategory.parent_id === categoryId) {
          throw new ValidationError('Circular reference detected in category hierarchy');
        }
      }

      // Update the category
      const updatedCategory = await this.categoryRepository.updateCategory(categoryId, data);
      
      logger.info(`Updated category: ${categoryId}`);
      return updatedCategory;
    } catch (error) {
      logger.error('Error updating category', { error, categoryId, data });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  /**
   * Delete a category
   * 
   * @param categoryId Category ID
   * @returns True if deleted successfully
   */
  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(categoryId);
      if (!existingCategory) {
        throw new NotFoundError('Category', categoryId);
      }

      // Check if category has subcategories
      const categories = await this.categoryRepository.findAll({ filter: { parent_id: categoryId } });
      if (categories.length > 0) {
        throw new ValidationError('Cannot delete category with subcategories');
      }

      // Count content in this category
      const contentCount = await this.categoryRepository.countContentInCategory(categoryId);
      if (contentCount > 0) {
        throw new ValidationError(`Cannot delete category with ${contentCount} content items`);
      }

      // Delete the category
      const deleted = await this.categoryRepository.delete(categoryId);
      
      if (deleted) {
        logger.info(`Deleted category: ${categoryId}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting category', { error, categoryId });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Get all categories in hierarchical structure
   * 
   * @returns Hierarchical array of categories
   */
  async getCategoryHierarchy(): Promise<CategoryWithChildren[]> {
    try {
      return await this.categoryRepository.getCategoryHierarchy();
    } catch (error) {
      logger.error('Error getting category hierarchy', { error });
      throw new Error(`Failed to get category hierarchy: ${error.message}`);
    }
  }

  /**
   * Get category by ID
   * 
   * @param categoryId Category ID
   * @returns Category or null if not found
   */
  async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      return await this.categoryRepository.findById(categoryId);
    } catch (error) {
      logger.error('Error getting category by ID', { error, categoryId });
      throw new Error(`Failed to get category: ${error.message}`);
    }
  }

  /**
   * Get category by slug
   * 
   * @param slug Category slug
   * @returns Category or null if not found
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      return await this.categoryRepository.getCategoryBySlug(slug);
    } catch (error) {
      logger.error('Error getting category by slug', { error, slug });
      throw new Error(`Failed to get category: ${error.message}`);
    }
  }

  /**
   * Create a new tag
   * 
   * @param data Tag data
   * @returns Created tag
   */
  async createTag(data: CreateTagDto): Promise<Tag> {
    try {
      // Check if name or slug is already in use
      const existingTagByName = await this.tagRepository.getTagByName(data.name);
      if (existingTagByName) {
        throw new ConflictError(`Tag with name '${data.name}' already exists`);
      }

      const existingTagBySlug = await this.tagRepository.getTagBySlug(data.slug);
      if (existingTagBySlug) {
        throw new ConflictError(`Tag with slug '${data.slug}' already exists`);
      }

      // Create the tag
      const tag = await this.tagRepository.createTag({
        ...data,
        id: uuidv4()
      });
      
      logger.info(`Created new tag: ${tag.name} (${tag.id})`);
      return tag;
    } catch (error) {
      logger.error('Error creating tag', { error, data });
      // Re-throw known errors
      if (error instanceof ConflictError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to create tag: ${error.message}`);
    }
  }

  /**
   * Update a tag
   * 
   * @param tagId Tag ID
   * @param data Tag data to update
   * @returns Updated tag
   */
  async updateTag(tagId: string, data: UpdateTagDto): Promise<Tag | null> {
    try {
      // Check if tag exists
      const existingTag = await this.tagRepository.findById(tagId);
      if (!existingTag) {
        throw new NotFoundError('Tag', tagId);
      }

      // Check if name is already in use by another tag
      if (data.name && data.name !== existingTag.name) {
        const tagWithName = await this.tagRepository.getTagByName(data.name);
        if (tagWithName && tagWithName.id !== tagId) {
          throw new ConflictError(`Tag with name '${data.name}' already exists`);
        }
      }

      // Check if slug is already in use by another tag
      if (data.slug && data.slug !== existingTag.slug) {
        const tagWithSlug = await this.tagRepository.getTagBySlug(data.slug);
        if (tagWithSlug && tagWithSlug.id !== tagId) {
          throw new ConflictError(`Tag with slug '${data.slug}' already exists`);
        }
      }

      // Update the tag
      const updatedTag = await this.tagRepository.updateTag(tagId, data);
      
      logger.info(`Updated tag: ${tagId}`);
      return updatedTag;
    } catch (error) {
      logger.error('Error updating tag', { error, tagId, data });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to update tag: ${error.message}`);
    }
  }

  /**
   * Delete a tag
   * 
   * @param tagId Tag ID
   * @returns True if deleted successfully
   */
  async deleteTag(tagId: string): Promise<boolean> {
    try {
      // Check if tag exists
      const existingTag = await this.tagRepository.findById(tagId);
      if (!existingTag) {
        throw new NotFoundError('Tag', tagId);
      }

      // Delete the tag
      const deleted = await this.tagRepository.delete(tagId);
      
      if (deleted) {
        logger.info(`Deleted tag: ${tagId}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting tag', { error, tagId });
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to delete tag: ${error.message}`);
    }
  }

  /**
   * Get popular tags
   * 
   * @param limit Maximum number of tags to return
   * @returns Array of popular tags with usage counts
   */
  async getPopularTags(limit: number = 20): Promise<TagWithCount[]> {
    try {
      return await this.tagRepository.getPopularTags(limit);
    } catch (error) {
      logger.error('Error getting popular tags', { error, limit });
      throw new Error(`Failed to get popular tags: ${error.message}`);
    }
  }

  /**
   * Get tag by ID
   * 
   * @param tagId Tag ID
   * @returns Tag or null if not found
   */
  async getTagById(tagId: string): Promise<Tag | null> {
    try {
      return await this.tagRepository.findById(tagId);
    } catch (error) {
      logger.error('Error getting tag by ID', { error, tagId });
      throw new Error(`Failed to get tag: ${error.message}`);
    }
  }

  /**
   * Get tag by slug
   * 
   * @param slug Tag slug
   * @returns Tag or null if not found
   */
  async getTagBySlug(slug: string): Promise<Tag | null> {
    try {
      return await this.tagRepository.getTagBySlug(slug);
    } catch (error) {
      logger.error('Error getting tag by slug', { error, slug });
      throw new Error(`Failed to get tag: ${error.message}`);
    }
  }

  /**
   * Associate tags with content
   * 
   * @param contentId Content ID
   * @param tagNames Array of tag names
   * @returns Number of associated tags
   */
  async tagContent(contentId: string, tagNames: string[]): Promise<number> {
    try {
      // Find or create tags
      const tags = await this.tagRepository.findOrCreateTags(tagNames);
      
      // Associate tags with content
      const result = await this.tagRepository.tagContent(contentId, tags.map(tag => tag.id));
      
      logger.info(`Tagged content ${contentId} with ${result} tags`);
      return result;
    } catch (error) {
      logger.error('Error tagging content', { error, contentId, tagNames });
      throw new Error(`Failed to tag content: ${error.message}`);
    }
  }

  /**
   * Get tags for content
   * 
   * @param contentId Content ID
   * @returns Array of tags
   */
  async getContentTags(contentId: string): Promise<Tag[]> {
    try {
      return await this.tagRepository.getContentTags(contentId);
    } catch (error) {
      logger.error('Error getting content tags', { error, contentId });
      throw new Error(`Failed to get content tags: ${error.message}`);
    }
  }

  /**
   * Suggest tags based on content text
   * 
   * @param contentText Content text
   * @param limit Maximum number of suggestions
   * @returns Array of tag suggestions
   */
  async suggestTags(contentText: string, limit: number = 5): Promise<Tag[]> {
    try {
      return await this.tagRepository.suggestTags(contentText, limit);
    } catch (error) {
      logger.error('Error suggesting tags', { error, contentText });
      throw new Error(`Failed to suggest tags: ${error.message}`);
    }
  }
}
