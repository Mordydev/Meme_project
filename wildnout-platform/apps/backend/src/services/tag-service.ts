import { FastifyInstance } from 'fastify';
import { NotFoundError } from '../lib/errors';

/**
 * Service for managing content tags
 */
export class TagService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Associate tags with content
   */
  async associateTagsWithContent(
    contentId: string,
    tags: string[],
    transaction?: any
  ): Promise<void> {
    const db = transaction || this.fastify.supabase;
    
    // Normalize tags (lowercase, remove duplicates)
    const normalizedTags = [...new Set(tags.map(tag => tag.toLowerCase().trim()))]
      .filter(tag => tag.length > 0);
    
    if (normalizedTags.length === 0) {
      return;
    }
    
    // Get or create tags
    const tagRecords = await Promise.all(
      normalizedTags.map(async (tagName) => {
        // Check if tag exists
        const { data: existingTag } = await db
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();
        
        if (existingTag) {
          return existingTag;
        }
        
        // Create new tag
        const { data: newTag, error } = await db
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
        
        if (error) {
          throw new Error(`Failed to create tag: ${error.message}`);
        }
        
        return newTag;
      })
    );
    
    // Associate tags with content
    const contentTagRelations = tagRecords.map(tag => ({
      contentId,
      tagId: tag.id,
      createdAt: new Date()
    }));
    
    const { error } = await db
      .from('content_tags')
      .insert(contentTagRelations);
    
    if (error) {
      throw new Error(`Failed to associate tags with content: ${error.message}`);
    }
  }

  /**
   * Update content tags (remove existing ones and add new ones)
   */
  async updateContentTags(
    contentId: string,
    tags: string[],
    transaction?: any
  ): Promise<void> {
    const db = transaction || this.fastify.supabase;
    
    // Delete existing content-tag associations
    const { error: deleteError } = await db
      .from('content_tags')
      .delete()
      .eq('contentId', contentId);
    
    if (deleteError) {
      throw new Error(`Failed to remove existing tags: ${deleteError.message}`);
    }
    
    // Associate new tags
    await this.associateTagsWithContent(contentId, tags, transaction);
  }

  /**
   * Get trending tags
   */
  async getTrendingTags(limit = 10): Promise<{ name: string; count: number }[]> {
    const { data, error } = await this.fastify.supabase
      .from('content_tags')
      .select(`
        tags (
          name
        ),
        count
      `)
      .order('count', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to get trending tags: ${error.message}`);
    }
    
    return data.map(item => ({
      name: item.tags.name,
      count: item.count
    }));
  }

  /**
   * Get tags for content
   */
  async getContentTags(contentId: string): Promise<string[]> {
    const { data, error } = await this.fastify.supabase
      .from('content_tags')
      .select(`
        tags (
          name
        )
      `)
      .eq('contentId', contentId);
    
    if (error) {
      throw new Error(`Failed to get content tags: ${error.message}`);
    }
    
    return data.map(item => item.tags.name);
  }

  /**
   * Search tags by prefix
   */
  async searchTags(prefix: string, limit = 10): Promise<string[]> {
    const { data, error } = await this.fastify.supabase
      .from('tags')
      .select('name')
      .ilike('name', `${prefix}%`)
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to search tags: ${error.message}`);
    }
    
    return data.map(tag => tag.name);
  }

  /**
   * Get content by tag
   */
  async getContentByTag(
    tagName: string,
    limit = 20,
    cursor?: string
  ): Promise<{
    contentIds: string[];
    hasMore: boolean;
    cursor?: string;
  }> {
    // Get tag id
    const { data: tag, error: tagError } = await this.fastify.supabase
      .from('tags')
      .select('id')
      .eq('name', tagName.toLowerCase().trim())
      .single();
    
    if (tagError || !tag) {
      throw new NotFoundError('tag', tagName);
    }
    
    // Get content with tag
    const query = this.fastify.supabase
      .from('content_tags')
      .select('contentId, createdAt')
      .eq('tagId', tag.id)
      .order('createdAt', { ascending: false })
      .limit(limit + 1);
    
    if (cursor) {
      query.lt('createdAt', cursor);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get content by tag: ${error.message}`);
    }
    
    const hasMore = data.length > limit;
    const contentItems = hasMore ? data.slice(0, limit) : data;
    
    return {
      contentIds: contentItems.map(item => item.contentId),
      hasMore,
      cursor: contentItems.length ? contentItems[contentItems.length - 1].createdAt : undefined
    };
  }
}
