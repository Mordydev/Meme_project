/**
 * Category Repository
 * 
 * Handles data access for content categories
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category';
import { logger } from '../lib/logger';

export class CategoryRepository extends BaseRepository<Category> {
  constructor(db: Pool) {
    super(db, 'categories', 'id');
  }
  
  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryDto): Promise<Category> {
    try {
      const { name, description, slug, parent_id, order, is_active = true } = input;
      
      // Calculate order if not provided
      let categoryOrder = order;
      if (!categoryOrder) {
        if (parent_id) {
          // Get max order of siblings
          const maxOrderResult = await this.db.query<{ max_order: number }>(
            `SELECT MAX(order) as max_order FROM categories WHERE parent_id = $1`,
            [parent_id]
          );
          categoryOrder = (maxOrderResult.rows[0].max_order || 0) + 1;
        } else {
          // Get max order of root categories
          const maxOrderResult = await this.db.query<{ max_order: number }>(
            `SELECT MAX(order) as max_order FROM categories WHERE parent_id IS NULL`
          );
          categoryOrder = (maxOrderResult.rows[0].max_order || 0) + 1;
        }
      }
      
      const query = `
        INSERT INTO categories
        (id, name, description, slug, parent_id, "order", is_active, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await this.db.query<Category>(query, [
        name,
        description,
        slug,
        parent_id || null,
        categoryOrder,
        is_active
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating category', { error, input });
      throw error;
    }
  }
  
  /**
   * Update a category
   */
  async updateCategory(id: string, input: UpdateCategoryDto): Promise<Category | null> {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic SET clause
      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      
      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }
      
      if (input.slug !== undefined) {
        updates.push(`slug = $${paramIndex++}`);
        values.push(input.slug);
      }
      
      if (input.parent_id !== undefined) {
        updates.push(`parent_id = $${paramIndex++}`);
        values.push(input.parent_id);
      }
      
      if (input.order !== undefined) {
        updates.push(`"order" = $${paramIndex++}`);
        values.push(input.order);
      }
      
      if (input.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(input.is_active);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      const query = `
        UPDATE categories
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.db.query<Category>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating category', { error, categoryId: id, input });
      throw error;
    }
  }
  
  /**
   * Get all categories with optional parent filter
   */
  async getAllCategories(parentId?: string | null): Promise<Category[]> {
    try {
      let query = `
        SELECT * FROM categories 
        WHERE is_active = true
      `;
      
      const queryParams: any[] = [];
      
      if (parentId !== undefined) {
        if (parentId === null) {
          query += ` AND parent_id IS NULL`;
        } else {
          query += ` AND parent_id = $1`;
          queryParams.push(parentId);
        }
      }
      
      query += ` ORDER BY "order" ASC`;
      
      const result = await this.db.query<Category>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting categories', { error, parentId });
      throw error;
    }
  }
  
  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const query = `SELECT * FROM categories WHERE slug = $1 AND is_active = true`;
      const result = await this.db.query<Category>(query, [slug]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting category by slug', { error, slug });
      throw error;
    }
  }
  
  /**
   * Get category with child categories
   */
  async getCategoryWithChildren(id: string): Promise<{ category: Category, children: Category[] }> {
    try {
      // Get the category
      const category = await this.findById(id);
      
      if (!category) {
        throw new Error(`Category with ID ${id} not found`);
      }
      
      // Get child categories
      const childrenQuery = `
        SELECT * FROM categories 
        WHERE parent_id = $1 AND is_active = true
        ORDER BY "order" ASC
      `;
      
      const childrenResult = await this.db.query<Category>(childrenQuery, [id]);
      
      return {
        category,
        children: childrenResult.rows
      };
    } catch (error) {
      logger.error('Error getting category with children', { error, categoryId: id });
      throw error;
    }
  }
  
  /**
   * Get full category tree
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      // Using recursive CTE to get the entire hierarchy efficiently
      const query = `
        WITH RECURSIVE category_tree AS (
          -- Base case: root categories
          SELECT id, name, description, slug, parent_id, "order", is_active, created_at, updated_at, 0 as depth
          FROM categories
          WHERE parent_id IS NULL AND is_active = true
          
          UNION ALL
          
          -- Recursive case: child categories
          SELECT c.id, c.name, c.description, c.slug, c.parent_id, c."order", c.is_active, c.created_at, c.updated_at, ct.depth + 1
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
          WHERE c.is_active = true
        )
        SELECT * FROM category_tree
        ORDER BY depth, "order";
      `;
      
      const result = await this.db.query<Category & { depth: number }>(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting category tree', { error });
      throw error;
    }
  }
  
  /**
   * Count content in category
   */
  async countContentInCategory(categoryId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM content
        WHERE category_id = $1 AND status = 'active'
      `;
      
      const result = await this.db.query<{ count: string }>(query, [categoryId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting content in category', { error, categoryId });
      throw error;
    }
  }
}
