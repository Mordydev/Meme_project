/**
 * Category Repository
 * 
 * Handles data access operations for content categories
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Category, 
  CreateCategoryDto, 
  UpdateCategoryDto,
  CategoryWithChildren 
} from '../models/entities/taxonomy/category.model';
import { logger } from '../lib/logger';

export class CategoryRepository extends BaseRepository<Category> {
  /**
   * Create a new CategoryRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'categories');
  }

  /**
   * Create a new category
   * 
   * @param data Category data
   * @returns Created category
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      // Set timestamps
      const now = new Date();
      
      return await this.create({
        ...data,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      logger.error('Error creating category', { error, data });
      throw error;
    }
  }

  /**
   * Update a category
   * 
   * @param id Category ID
   * @param data Category data to update
   * @returns Updated category or null if not found
   */
  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating category', { error, id, data });
      throw error;
    }
  }

  /**
   * Get all categories with hierarchical structure
   * 
   * @returns Hierarchical array of categories
   */
  async getCategoryHierarchy(): Promise<CategoryWithChildren[]> {
    try {
      // First, get all categories
      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM content WHERE category_id = c.id) as content_count
        FROM categories c
        ORDER BY c.order ASC
      `;
      
      const result = await this.db.query(query);
      const categories = result.rows.map(row => ({
        ...this.mapToEntity(row),
        content_count: parseInt(row.content_count || '0')
      }));
      
      // Then build the hierarchy
      return this.buildCategoryTree(categories);
    } catch (error) {
      logger.error('Error getting category hierarchy', { error });
      throw error;
    }
  }

  /**
   * Get a category by slug
   * 
   * @param slug Category slug
   * @returns Category or null if not found
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const query = `
        SELECT * FROM categories
        WHERE slug = $1
      `;
      
      const result = await this.db.query(query, [slug]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error getting category by slug', { error, slug });
      throw error;
    }
  }

  /**
   * Count content items in a category
   * 
   * @param categoryId Category ID
   * @returns Count of content items
   */
  async countContentInCategory(categoryId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM content
        WHERE category_id = $1 AND status = 'active'
      `;
      
      const result = await this.db.query(query, [categoryId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting content in category', { error, categoryId });
      throw error;
    }
  }

  /**
   * Build a tree structure from flat categories array
   * 
   * @param categories Flat array of categories
   * @returns Tree structure
   */
  private buildCategoryTree(categories: (Category & { content_count?: number })[]): CategoryWithChildren[] {
    // Create a map for quick lookup
    const categoryMap = new Map<string, CategoryWithChildren>();
    
    // First pass: Create map entries with empty subcategories arrays
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        subcategories: []
      });
    });
    
    // Second pass: Build hierarchy
    const rootCategories: CategoryWithChildren[] = [];
    
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        // Add to parent's subcategories
        categoryMap.get(category.parent_id)!.subcategories!.push(categoryWithChildren);
      } else {
        // Root category
        rootCategories.push(categoryWithChildren);
      }
    });
    
    return rootCategories;
  }

  /**
   * Map database row to Category entity
   * 
   * @param row Database row
   * @returns Category entity
   */
  protected mapToEntity(row: Record<string, any>): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      parent_id: row.parent_id,
      order: row.order,
      icon: row.icon,
      color: row.color,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
