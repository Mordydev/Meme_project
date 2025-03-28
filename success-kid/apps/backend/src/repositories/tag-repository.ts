/**
 * Tag Repository
 * 
 * Handles data access operations for content tags
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Tag, 
  CreateTagDto, 
  UpdateTagDto,
  ContentTags,
  TagWithCount
} from '../models/entities/taxonomy/tag.model';
import { logger } from '../lib/logger';

export class TagRepository extends BaseRepository<Tag> {
  /**
   * Create a new TagRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'tags');
  }

  /**
   * Create a new tag
   * 
   * @param data Tag data
   * @returns Created tag
   */
  async createTag(data: CreateTagDto): Promise<Tag> {
    try {
      // Set timestamps
      const now = new Date();
      
      return await this.create({
        ...data,
        usage_count: 0,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      logger.error('Error creating tag', { error, data });
      throw error;
    }
  }

  /**
   * Update a tag
   * 
   * @param id Tag ID
   * @param data Tag data to update
   * @returns Updated tag or null if not found
   */
  async updateTag(id: string, data: UpdateTagDto): Promise<Tag | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating tag', { error, id, data });
      throw error;
    }
  }

  /**
   * Get a tag by slug
   * 
   * @param slug Tag slug
   * @returns Tag or null if not found
   */
  async getTagBySlug(slug: string): Promise<Tag | null> {
    try {
      const query = `
        SELECT * FROM tags
        WHERE slug = $1
      `;
      
      const result = await this.db.query(query, [slug]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error getting tag by slug', { error, slug });
      throw error;
    }
  }

  /**
   * Get a tag by name (case insensitive)
   * 
   * @param name Tag name
   * @returns Tag or null if not found
   */
  async getTagByName(name: string): Promise<Tag | null> {
    try {
      const query = `
        SELECT * FROM tags
        WHERE LOWER(name) = LOWER($1)
      `;
      
      const result = await this.db.query(query, [name]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error getting tag by name', { error, name });
      throw error;
    }
  }

  /**
   * Get popular tags with usage counts
   * 
   * @param limit Maximum number of tags to return
   * @returns Array of tags with usage counts
   */
  async getPopularTags(limit: number = 20): Promise<TagWithCount[]> {
    try {
      const query = `
        SELECT t.*, COUNT(ct.content_id) as content_count
        FROM tags t
        LEFT JOIN content_tags ct ON t.id = ct.tag_id
        GROUP BY t.id
        ORDER BY t.usage_count DESC, content_count DESC
        LIMIT $1
      `;
      
      const result = await this.db.query(query, [limit]);
      
      return result.rows.map(row => ({
        ...this.mapToEntity(row),
        content_count: parseInt(row.content_count || '0')
      }));
    } catch (error) {
      logger.error('Error getting popular tags', { error, limit });
      throw error;
    }
  }

  /**
   * Associate tags with content
   * 
   * @param contentId Content ID
   * @param tagIds Array of tag IDs
   * @returns Number of associated tags
   */
  async tagContent(contentId: string, tagIds: string[]): Promise<number> {
    try {
      // Use a transaction to ensure consistency
      return await this.withTransaction(async (client) => {
        // First, remove existing associations
        await client.query(`
          DELETE FROM content_tags
          WHERE content_id = $1
        `, [contentId]);
        
        // If no tags to add, return
        if (tagIds.length === 0) {
          return 0;
        }
        
        // Create values for bulk insert
        const values = tagIds.map(tagId => `('${contentId}', '${tagId}')`).join(', ');
        
        // Insert new associations
        const insertResult = await client.query(`
          INSERT INTO content_tags (content_id, tag_id)
          VALUES ${values}
          ON CONFLICT (content_id, tag_id) DO NOTHING
          RETURNING tag_id
        `);
        
        // Update tag usage counts for each tag
        for (const tagId of tagIds) {
          await client.query(`
            UPDATE tags
            SET usage_count = (
              SELECT COUNT(*) FROM content_tags WHERE tag_id = $1
            )
            WHERE id = $1
          `, [tagId]);
        }
        
        // Update content's tags array for efficient querying
        await client.query(`
          UPDATE content
          SET tags = (
            SELECT array_agg(t.name)
            FROM tags t
            JOIN content_tags ct ON t.id = ct.tag_id
            WHERE ct.content_id = $1
          )
          WHERE id = $1
        `, [contentId]);
        
        return insertResult.rowCount;
      });
    } catch (error) {
      logger.error('Error tagging content', { error, contentId, tagIds });
      throw error;
    }
  }

  /**
   * Get tags for a content item
   * 
   * @param contentId Content ID
   * @returns Array of tags
   */
  async getContentTags(contentId: string): Promise<Tag[]> {
    try {
      const query = `
        SELECT t.*
        FROM tags t
        JOIN content_tags ct ON t.id = ct.tag_id
        WHERE ct.content_id = $1
        ORDER BY t.name
      `;
      
      const result = await this.db.query(query, [contentId]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error getting content tags', { error, contentId });
      throw error;
    }
  }

  /**
   * Find or create tags by names
   * 
   * @param tagNames Array of tag names
   * @returns Array of tags (existing or newly created)
   */
  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    try {
      const uniqueNames = [...new Set(tagNames.map(name => name.trim()))];
      const result: Tag[] = [];
      
      // Use a transaction to ensure consistency
      await this.withTransaction(async (client) => {
        for (const name of uniqueNames) {
          // Skip empty names
          if (!name) continue;
          
          // Check if tag already exists
          const existingTag = await this.getTagByName(name);
          
          if (existingTag) {
            result.push(existingTag);
          } else {
            // Create slug from name
            const slug = name.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
              .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
            
            // Create new tag
            const newTag = await this.createTag({
              name,
              slug: slug || name.toLowerCase().replace(/\s+/g, '-')
            });
            
            result.push(newTag);
          }
        }
      });
      
      return result;
    } catch (error) {
      logger.error('Error finding or creating tags', { error, tagNames });
      throw error;
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
      // Extract keywords from content text
      const keywords = this.extractKeywords(contentText);
      
      if (keywords.length === 0) {
        return [];
      }
      
      // Find tags matching keywords
      const placeholders = keywords.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        SELECT t.*, similarity(t.name, unnest(ARRAY[${placeholders}])) as relevance
        FROM tags t
        ORDER BY relevance DESC, usage_count DESC
        LIMIT $${keywords.length + 1}
      `;
      
      const result = await this.db.query(query, [...keywords, limit]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error suggesting tags', { error, contentText });
      throw error;
    }
  }

  /**
   * Extract keywords from content text
   * 
   * @param text Content text
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - split text into words, filter by length
    if (!text) return [];
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length >= 3) // Keep words of at least 3 characters
      .filter(word => !this.isStopWord(word)) // Remove stop words
      .slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Check if a word is a common stop word
   * 
   * @param word Word to check
   * @returns True if it's a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'this', 'that', 'with', 'from', 'for', 'was', 'were',
      'have', 'has', 'had', 'a', 'an', 'are', 'but', 'what', 'when', 'where',
      'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'than', 'too', 'very', 'just', 'can', 'will', 'should',
      'now', 'our', 'your', 'their', 'who', 'not', 'its', 'his', 'her', 'they',
      'them', 'upon', 'within', 'which', 'about', 'there', 'before', 'after',
      'above', 'below', 'under', 'over', 'you', 'then'
    ];
    
    return stopWords.includes(word);
  }

  /**
   * Map database row to Tag entity
   * 
   * @param row Database row
   * @returns Tag entity
   */
  protected mapToEntity(row: Record<string, any>): Tag {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      is_featured: row.is_featured,
      usage_count: row.usage_count || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
