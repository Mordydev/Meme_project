/**
 * Forum Repository
 * 
 * Handles data access operations for forums
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Forum,
  CreateForumDto,
  UpdateForumDto,
  ForumListItem
} from '../models/entities/forum/forum.model';
import { logger } from '../lib/logger';

export class ForumRepository extends BaseRepository<Forum> {
  /**
   * Create a new ForumRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'forums');
  }

  /**
   * Create a new forum
   * 
   * @param data Forum data
   * @returns Created forum
   */
  async createForum(data: CreateForumDto): Promise<Forum> {
    try {
      // Set created_at and updated_at
      const now = new Date();
      return await this.create({
        ...data,
        created_at: now,
        updated_at: now,
        status: data.status || 'active'
      });
    } catch (error) {
      logger.error('Error creating forum', { error, data });
      throw error;
    }
  }

  /**
   * Update a forum
   * 
   * @param id Forum ID
   * @param data Forum data to update
   * @returns Updated forum
   */
  async updateForum(id: string, data: UpdateForumDto): Promise<Forum | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating forum', { error, id, data });
      throw error;
    }
  }

  /**
   * Get all forums with stats
   * 
   * @returns Array of forums with stats
   */
  async getAllForums(): Promise<ForumListItem[]> {
    try {
      const query = `
        SELECT 
          f.*,
          (SELECT COUNT(*) FROM threads WHERE forum_id = f.id) as thread_count,
          (SELECT COUNT(*) FROM comments c 
           JOIN content ct ON c.content_id = ct.id 
           JOIN threads t ON ct.id = t.content_id 
           WHERE t.forum_id = f.id) as post_count,
          (SELECT MAX(t.last_activity_at) FROM threads t WHERE t.forum_id = f.id) as last_activity
        FROM forums f
        WHERE f.status = 'active'
        ORDER BY f.order ASC
      `;
      
      const result = await this.db.query(query);
      
      // Map to forum list items
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        slug: row.slug,
        type: row.type,
        status: row.status,
        order: row.order,
        icon: row.icon,
        theme_color: row.theme_color,
        stats: {
          threads: parseInt(row.thread_count || '0'),
          posts: parseInt(row.post_count || '0'),
          activity: row.last_activity ? row.last_activity.getTime() : 0
        }
      }));
    } catch (error) {
      logger.error('Error getting all forums', { error });
      throw error;
    }
  }

  /**
   * Get forum by slug
   * 
   * @param slug Forum slug
   * @returns Forum with categories and stats
   */
  async getForumBySlug(slug: string): Promise<ForumListItem | null> {
    try {
      const query = `
        SELECT 
          f.*,
          (SELECT COUNT(*) FROM threads WHERE forum_id = f.id) as thread_count,
          (SELECT COUNT(*) FROM comments c 
           JOIN content ct ON c.content_id = ct.id 
           JOIN threads t ON ct.id = t.content_id 
           WHERE t.forum_id = f.id) as post_count,
          (SELECT MAX(t.last_activity_at) FROM threads t WHERE t.forum_id = f.id) as last_activity
        FROM forums f
        WHERE f.slug = $1 AND f.status = 'active'
      `;
      
      const result = await this.db.query(query, [slug]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Map to forum list item
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        slug: row.slug,
        type: row.type,
        status: row.status,
        order: row.order,
        icon: row.icon,
        theme_color: row.theme_color,
        stats: {
          threads: parseInt(row.thread_count || '0'),
          posts: parseInt(row.post_count || '0'),
          activity: row.last_activity ? row.last_activity.getTime() : 0
        }
      };
    } catch (error) {
      logger.error('Error getting forum by slug', { error, slug });
      throw error;
    }
  }

  /**
   * Get forum with categories
   * 
   * @param forumId Forum ID
   * @returns Forum with categories
   */
  async getForumWithCategories(forumId: string): Promise<Forum | null> {
    try {
      // Get forum
      const forum = await this.findById(forumId);
      if (!forum) {
        return null;
      }
      
      // Get categories for forum
      const categoriesQuery = `
        SELECT c.*
        FROM categories c
        WHERE c.forum_id = $1 AND c.parent_id IS NULL
        ORDER BY c.order ASC
      `;
      
      const categoriesResult = await this.db.query(categoriesQuery, [forumId]);
      
      // Get all subcategories
      const subcategoriesQuery = `
        SELECT c.*
        FROM categories c
        WHERE c.forum_id = $1 AND c.parent_id IS NOT NULL
        ORDER BY c.order ASC
      `;
      
      const subcategoriesResult = await this.db.query(subcategoriesQuery, [forumId]);
      
      // Build category hierarchy
      const categories = categoriesResult.rows.map(category => {
        const subcategories = subcategoriesResult.rows
          .filter(sub => sub.parent_id === category.id)
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            description: sub.description,
            slug: sub.slug,
            parent_id: sub.parent_id,
            order: sub.order,
            icon: sub.icon,
            color: sub.color,
            is_active: sub.is_active,
            created_at: sub.created_at,
            updated_at: sub.updated_at
          }));
        
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          slug: category.slug,
          parent_id: category.parent_id,
          order: category.order,
          icon: category.icon,
          color: category.color,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at,
          subcategories
        };
      });
      
      // Return forum with categories
      return {
        ...forum,
        categories
      } as any;
    } catch (error) {
      logger.error('Error getting forum with categories', { error, forumId });
      throw error;
    }
  }

  /**
   * Map database row to Forum entity
   * 
   * @param row Database row
   * @returns Forum entity
   */
  protected mapToEntity(row: Record<string, any>): Forum {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      type: row.type,
      status: row.status,
      order: row.order,
      icon: row.icon,
      banner_image: row.banner_image,
      theme_color: row.theme_color,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata || {}
    };
  }
}
