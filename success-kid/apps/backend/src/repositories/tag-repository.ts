/**
 * Tag Repository
 * 
 * Handles data access for content tags
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Tag, CreateTagDto, UpdateTagDto } from '../models/tag';
import { logger } from '../lib/logger';

export class TagRepository extends BaseRepository<Tag> {
  constructor(db: Pool) {
    super(db, 'tags', 'id');
  }
  
  /**
   * Create a new tag
   */
  async createTag(input: CreateTagDto): Promise<Tag> {
    try {
      const { name, slug } = input;
      
      // Generate slug from name if not provided
      const tagSlug = slug || name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word characters
        .replace(/\s+/g, '-')     // Replace spaces with dashes
        .replace(/-+/g, '-');     // Replace consecutive dashes
      
      // Check if tag already exists
      const existingTag = await this.findBySlug(tagSlug);
      if (existingTag) {
        // Increment count if tag exists
        const updatedTag = await this.incrementTagCount(existingTag.id);
        return updatedTag || existingTag;
      }
      
      // Create new tag
      const query = `
        INSERT INTO tags
        (id, name, slug, count, created_at)
        VALUES (uuid_generate_v4(), $1, $2, 1, NOW())
        RETURNING *
      `;
      
      const result = await this.db.query<Tag>(query, [name, tagSlug]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating tag', { error, input });
      throw error;
    }
  }
  
  /**
   * Find tag by slug
   */
  async findBySlug(slug: string): Promise<Tag | null> {
    try {
      const query = `SELECT * FROM tags WHERE slug = $1`;
      const result = await this.db.query<Tag>(query, [slug]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding tag by slug', { error, slug });
      throw error;
    }
  }
  
  /**
   * Increment tag count
   */
  async incrementTagCount(id: string): Promise<Tag | null> {
    try {
      const query = `
        UPDATE tags
        SET count = count + 1
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query<Tag>(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error incrementing tag count', { error, tagId: id });
      throw error;
    }
  }
  
  /**
   * Decrement tag count
   */
  async decrementTagCount(id: string): Promise<Tag | null> {
    try {
      const query = `
        UPDATE tags
        SET count = GREATEST(0, count - 1)
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query<Tag>(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error decrementing tag count', { error, tagId: id });
      throw error;
    }
  }
  
  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<Tag[]> {
    try {
      const query = `
        SELECT * FROM tags
        ORDER BY count DESC
        LIMIT $1
      `;
      
      const result = await this.db.query<Tag>(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting popular tags', { error, limit });
      throw error;
    }
  }
  
  /**
   * Associate tags with content
   */
  async tagContent(contentId: string, tagIds: string[]): Promise<void> {
    try {
      // Begin transaction
      return this.executeTransaction(async (client) => {
        // Remove existing tags for the content
        await client.query(
          `DELETE FROM content_tags WHERE content_id = $1`,
          [contentId]
        );
        
        // Add new tags
        if (tagIds.length === 0) {
          return;
        }
        
        // Build values for bulk insert
        const values = tagIds.map((tagId) => `('${contentId}', '${tagId}', NOW())`).join(', ');
        
        const insertQuery = `
          INSERT INTO content_tags 
          (content_id, tag_id, created_at)
          VALUES ${values}
        `;
        
        await client.query(insertQuery);
      });
    } catch (error) {
      logger.error('Error tagging content', { error, contentId, tagIds });
      throw error;
    }
  }
  
  /**
   * Get tags for content
   */
  async getContentTags(contentId: string): Promise<Tag[]> {
    try {
      const query = `
        SELECT t.*
        FROM tags t
        JOIN content_tags ct ON t.id = ct.tag_id
        WHERE ct.content_id = $1
        ORDER BY t.name ASC
      `;
      
      const result = await this.db.query<Tag>(query, [contentId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting content tags', { error, contentId });
      throw error;
    }
  }
  
  /**
   * Find or create tags from names
   */
  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    try {
      if (tagNames.length === 0) {
        return [];
      }
      
      // Normalize and filter tag names
      const normalizedTags = tagNames
        .map(name => name.trim())
        .filter(name => name.length >= 2 && name.length <= 50)
        .filter((value, index, self) => self.indexOf(value) === index); // Unique values
      
      if (normalizedTags.length === 0) {
        return [];
      }
      
      return this.executeTransaction(async (client) => {
        const tags: Tag[] = [];
        
        for (const name of normalizedTags) {
          // Generate slug
          const slug = name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
          
          // Check if tag exists
          const existingResult = await client.query<Tag>(
            `SELECT * FROM tags WHERE slug = $1`,
            [slug]
          );
          
          if (existingResult.rows.length > 0) {
            // Increment count for existing tag
            const updateResult = await client.query<Tag>(
              `UPDATE tags SET count = count + 1 WHERE id = $1 RETURNING *`,
              [existingResult.rows[0].id]
            );
            
            tags.push(updateResult.rows[0]);
          } else {
            // Create new tag
            const insertResult = await client.query<Tag>(
              `INSERT INTO tags (id, name, slug, count, created_at)
               VALUES (uuid_generate_v4(), $1, $2, 1, NOW())
               RETURNING *`,
              [name, slug]
            );
            
            tags.push(insertResult.rows[0]);
          }
        }
        
        return tags;
      });
    } catch (error) {
      logger.error('Error finding or creating tags', { error, tagNames });
      throw error;
    }
  }
  
  /**
   * Search tags by name
   */
  async searchTags(query: string, limit: number = 10): Promise<Tag[]> {
    try {
      const searchQuery = `
        SELECT * FROM tags
        WHERE name ILIKE $1
        ORDER BY count DESC
        LIMIT $2
      `;
      
      const result = await this.db.query<Tag>(searchQuery, [`%${query}%`, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching tags', { error, query, limit });
      throw error;
    }
  }
}
