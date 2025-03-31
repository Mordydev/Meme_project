/**
 * Tag Repository
 * 
 * Handles data access operations for tags using Drizzle ORM.
 */
import { eq, inArray as dbIn, and, sql } from 'drizzle-orm'; // Corrected import: inArray is the operator
import { nanoid } from 'nanoid'; // Import nanoid for ID generation
import { BaseRepository } from './base-repository';
import { db } from '../database';
import { tags, Tag, NewTag, contentTags, draftTags } from '../database/schema/tags';
import { Logger } from 'pino';
// Placeholder for logger import
let logger: Logger;
try {
  const loggerModule = require('../lib/logger');
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger', using console.", e);
  logger = console as any;
}

export class TagRepository extends BaseRepository<Tag, typeof tags, NewTag> {
  constructor() {
    // Pass the Drizzle schema, ID column, and optional column mapping
    super(
      tags,
      tags.id,
      {
        // Map only existing columns
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        description: tags.description,
        color: tags.color,
        updatedAt: tags.updatedAt
        // Removed isActive
      }
    );
  }

  /**
   * Find or create tags by names
   * @param tagNames Array of tag names
   * @returns Array of found or newly created tags
   */
  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    try {
      if (!tagNames.length) return [];

      // Normalize and filter tag names
      const normalizedTags = tagNames
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .slice(0, 10); // Limit to 10 tags

      if (!normalizedTags.length) return [];

      // Find existing tags
      const existingTags = await db.select()
        .from(tags)
        .where(dbIn(tags.name, normalizedTags));

      // Determine which tags need to be created
      const existingTagNames = existingTags.map(tag => tag.name);
      const newTagNames = normalizedTags.filter(name => !existingTagNames.includes(name));

      // Create new tags
      if (newTagNames.length > 0) {
        const newTagsData: NewTag[] = newTagNames.map(name => ({
          id: nanoid(), // Generate ID
          name,
          slug: this.createSlug(name),
          // description and color could be added here if needed, otherwise defaults apply
        }));
        const newTags = await db.insert(tags)
          .values(newTagsData) // Insert objects matching NewTag type
          .returning();

        return [...existingTags, ...newTags];
      }

      return existingTags;
    } catch (error) {
      logger.error('Error in findOrCreateTags', { tagNames, error });
      throw new Error(`Failed to find or create tags: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tag a content item with multiple tags
   * @param contentId Content ID
   * @param tagIds Array of tag IDs
   * @returns Boolean success indicator
   */
  async tagContent(contentId: string, tagIds: string[]): Promise<boolean> {
    try {
      if (!tagIds.length) return true;

      // Remove existing tags for this content
      await db.delete(contentTags)
        .where(eq(contentTags.contentId, contentId));

      // Add new tags
      await db.insert(contentTags)
        .values(tagIds.map(tagId => ({
          contentId,
          tagId
        })));

      return true;
    } catch (error) {
      logger.error('Error in tagContent', { contentId, tagIds, error });
      throw new Error(`Failed to tag content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tag a draft with multiple tags
   * @param draftId Draft ID
   * @param tagIds Array of tag IDs
   * @returns Boolean success indicator
   */
  async tagDraft(draftId: string, tagIds: string[]): Promise<boolean> {
    try {
      if (!tagIds.length) return true;

      // Remove existing tags for this draft
      await db.delete(draftTags)
        .where(eq(draftTags.draftId, draftId));

      // Add new tags
      await db.insert(draftTags)
        .values(tagIds.map(tagId => ({
          draftId,
          tagId
        })));

      return true;
    } catch (error) {
      logger.error('Error in tagDraft', { draftId, tagIds, error });
      throw new Error(`Failed to tag draft: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tags for a content item
   * @param contentId Content ID
   * @returns Array of tags
   */
  async getContentTags(contentId: string): Promise<Tag[]> {
    try {
      const result = await db.select({
          tag: tags
        })
        .from(contentTags)
        .innerJoin(tags, eq(contentTags.tagId, tags.id))
        .where(eq(contentTags.contentId, contentId));

      return result.map(r => r.tag);
    } catch (error) {
      logger.error('Error in getContentTags', { contentId, error });
      throw new Error(`Failed to get content tags: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tags for a draft
   * @param draftId Draft ID
   * @returns Array of tags
   */
  async getDraftTags(draftId: string): Promise<Tag[]> {
    try {
      const result = await db.select({
          tag: tags
        })
        .from(draftTags)
        .innerJoin(tags, eq(draftTags.tagId, tags.id))
        .where(eq(draftTags.draftId, draftId));

      return result.map(r => r.tag);
    } catch (error) {
      logger.error('Error in getDraftTags', { draftId, error });
      throw new Error(`Failed to get draft tags: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tag by slug
   * @param slug Tag slug
   * @returns Tag or null if not found
   */
  async getTagBySlug(slug: string): Promise<Tag | null> {
    try {
      const result = await db.select()
        .from(tags)
        .where(eq(tags.slug, slug))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      logger.error('Error in getTagBySlug', { slug, error });
      throw new Error(`Failed to get tag by slug: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find multiple tags by slug
   * @param slugs Array of tag slugs
   * @returns Array of tags
   */
  async findManyBySlugs(slugs: string[]): Promise<Tag[]> {
    try {
      if (!slugs.length) return [];
      
      return await db.select()
        .from(tags)
        .where(dbIn(tags.slug, slugs));
    } catch (error) {
      logger.error('Error in findManyBySlugs', { slugs, error });
      throw new Error(`Failed to find tags by slugs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a URL-friendly slug from a tag name
   * @param name Tag name
   * @returns Slug
   */
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .trim();
  }

  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * @param record The raw database record
   * @returns The mapped entity
   */
  protected mapToEntity(record: Record<string, any>): Tag {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      color: record.color,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      description: record.description // Added missing fields from schema
      // Removed duplicate color and isActive
    };
  }
}

// Export a singleton instance
export const tagRepository = new TagRepository();
