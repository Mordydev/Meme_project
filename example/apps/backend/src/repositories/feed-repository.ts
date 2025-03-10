import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { FeedItem } from '../models/social';
import { SupabaseClient } from '@supabase/supabase-js';

export interface FeedQuery {
  userId: string;
  following?: string[];
  interests?: string[];
  excludeIds?: string[];
  cursor?: string;
  limit: number;
}

/**
 * Repository for handling activity feed
 */
export class FeedRepository extends BaseRepository<FeedItem> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'feed_items');
  }

  /**
   * Get feed based on constructed query
   */
  async getFeed(query: FeedQuery): Promise<{
    data: FeedItem[];
    meta: {
      cursor: string | null;
      hasMore: boolean;
    };
  }> {
    let feedQuery = this.db
      .from(this.tableName)
      .select(`
        *,
        content:content(*),
        battle:battles(*),
        achievement:achievements(*),
        user:user_profiles(*)
      `)
      .order('priority', { ascending: false })
      .order('createdAt', { ascending: false })
      .limit(query.limit);
    
    // Apply filtering based on following users
    if (query.following && query.following.length > 0) {
      feedQuery = feedQuery.or(`userId.in.(${query.following.join(',')}),type.eq.battle`);
    }
    
    // Apply cursor-based pagination
    if (query.cursor) {
      const [timestamp, id] = this.decodeCursor(query.cursor);
      feedQuery = feedQuery.or(`createdAt.lt.${timestamp},and(createdAt.eq.${timestamp},id.lt.${id})`);
    }
    
    // Exclude specific feed items
    if (query.excludeIds && query.excludeIds.length > 0) {
      feedQuery = feedQuery.not('id', 'in', `(${query.excludeIds.join(',')})`);
    }
    
    // Execute query
    const { data, error } = await feedQuery;
    
    if (error) {
      this.logger.error(error, 'Failed to get feed');
      throw new Error(`Failed to get feed: ${error.message}`);
    }
    
    // Calculate next cursor
    let cursor = null;
    if (data.length === query.limit) {
      const lastItem = data[data.length - 1];
      cursor = this.encodeCursor(lastItem.createdAt, lastItem.id);
    }
    
    return {
      data,
      meta: {
        cursor,
        hasMore: data.length === query.limit
      }
    };
  }

  /**
   * Get discovery feed for trending content and battles
   */
  async getDiscoveryFeed(params: {
    limit: number;
    cursor?: string;
    category?: string;
    includeTypes: string[];
    userId?: string;
    following?: string[];
    interests?: string[];
  }): Promise<{
    data: FeedItem[];
    meta: {
      cursor: string | null;
      hasMore: boolean;
    };
  }> {
    const { limit, cursor, category, includeTypes, userId, following, interests } = params;
    
    // Start building the query
    let feedQuery = this.db
      .from(this.tableName)
      .select(`
        *,
        content:content(*),
        battle:battles(*),
        user:user_profiles(*)
      `)
      .in('type', includeTypes)
      .order('priority', { ascending: false })
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    // Apply category filter if provided
    if (category) {
      feedQuery = feedQuery.eq('category', category);
    }
    
    // Apply cursor-based pagination
    if (cursor) {
      const [timestamp, id] = this.decodeCursor(cursor);
      feedQuery = feedQuery.or(`createdAt.lt.${timestamp},and(createdAt.eq.${timestamp},id.lt.${id})`);
    }
    
    // Apply personalization if user context is provided
    if (userId && following && following.length > 0) {
      // Boost content from followed users
      feedQuery = feedQuery.or(`userId.in.(${following.join(',')}),boost.eq.true`);
    }
    
    // Add interest-based filtering if available
    if (interests && interests.length > 0) {
      // This would be a more complex implementation based on content tags/categories
      // Simple implementation shown here
      feedQuery = feedQuery.or(`interests.overlap.{${interests.join(',')}}`);
    }
    
    // Execute query
    const { data, error } = await feedQuery;
    
    if (error) {
      this.logger.error(error, 'Failed to get discovery feed');
      throw new Error(`Failed to get discovery feed: ${error.message}`);
    }
    
    // Calculate next cursor
    let cursor = null;
    if (data.length === limit) {
      const lastItem = data[data.length - 1];
      cursor = this.encodeCursor(lastItem.createdAt, lastItem.id);
    }
    
    return {
      data,
      meta: {
        cursor,
        hasMore: data.length === limit
      }
    };
  }

  /**
   * Add item to feed
   */
  async addFeedItem(item: Omit<FeedItem, 'id'>, transaction?: SupabaseClient): Promise<FeedItem> {
    const db = transaction || this.db;
    
    const { data, error } = await db
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
    
    if (error) {
      this.logger.error(error, 'Failed to add feed item');
      throw new Error(`Failed to add feed item: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Delete feed items for a specific item (content, battle, etc.)
   */
  async deleteFeedItemsByReference(
    type: FeedItem['type'],
    itemId: string,
    transaction?: SupabaseClient
  ): Promise<void> {
    const db = transaction || this.db;
    
    const { error } = await db
      .from(this.tableName)
      .delete()
      .eq('type', type)
      .eq('itemId', itemId);
    
    if (error) {
      this.logger.error(error, `Failed to delete feed items for ${type} ${itemId}`);
      throw new Error(`Failed to delete feed items: ${error.message}`);
    }
  }

  /**
   * Encode cursor for pagination
   */
  encodeCursor(timestamp: Date, id: string): string {
    return Buffer.from(`${timestamp.toISOString()}|${id}`).toString('base64');
  }

  /**
   * Decode cursor from pagination
   */
  decodeCursor(cursor: string): [string, string] {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [timestamp, id] = decoded.split('|');
    return [timestamp, id];
  }
}
