import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { Reaction, Follow } from '../models/social';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository for handling social interactions
 */
export class SocialRepository extends BaseRepository<Reaction | Follow> {
  constructor(fastify: FastifyInstance) {
    super(fastify, ''); // We'll use multiple tables
  }

  /**
   * Create a new reaction
   */
  async createReaction(reaction: Omit<Reaction, 'id'>, transaction?: SupabaseClient): Promise<Reaction> {
    const db = transaction || this.db;
    
    const { data, error } = await db
      .from('reactions')
      .insert(reaction)
      .select()
      .single();
      
    if (error) {
      this.logger.error(error, 'Failed to create reaction');
      throw new Error(`Failed to create reaction: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Find a user's reaction to a target
   */
  async findUserReaction(
    userId: string, 
    targetType: 'content' | 'comment',
    targetId: string,
    transaction?: SupabaseClient
  ): Promise<Reaction | null> {
    const db = transaction || this.db;
    
    const { data, error } = await db
      .from('reactions')
      .select('*')
      .eq('userId', userId)
      .eq('targetType', targetType)
      .eq('targetId', targetId)
      .maybeSingle();
    
    if (error) {
      this.logger.error(error, `Failed to find user reaction for ${targetType} ${targetId}`);
      throw new Error(`Failed to find user reaction: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Delete a reaction
   */
  async deleteReaction(
    reactionId: string,
    transaction?: SupabaseClient
  ): Promise<void> {
    const db = transaction || this.db;
    
    const { error } = await db
      .from('reactions')
      .delete()
      .eq('id', reactionId);
    
    if (error) {
      this.logger.error(error, `Failed to delete reaction ${reactionId}`);
      throw new Error(`Failed to delete reaction: ${error.message}`);
    }
  }

  /**
   * Get reactions for a target
   */
  async getReactionsForTarget(
    targetType: 'content' | 'comment',
    targetId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ reactions: Reaction[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const { data, error, count } = await this.db
      .from('reactions')
      .select('*, user:user_profiles!userId(id, username, displayName, imageUrl)', { count: 'exact' })
      .eq('targetType', targetType)
      .eq('targetId', targetId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      this.logger.error(error, `Failed to get reactions for ${targetType} ${targetId}`);
      throw new Error(`Failed to get reactions: ${error.message}`);
    }
    
    return {
      reactions: data,
      total: count || 0
    };
  }

  /**
   * Get reaction count summary for a target
   */
  async getReactionCounts(
    targetType: 'content' | 'comment',
    targetId: string
  ): Promise<Record<string, number>> {
    const { data, error } = await this.db
      .from('reactions')
      .select('type')
      .eq('targetType', targetType)
      .eq('targetId', targetId);
    
    if (error) {
      this.logger.error(error, `Failed to get reaction counts for ${targetType} ${targetId}`);
      throw new Error(`Failed to get reaction counts: ${error.message}`);
    }
    
    const counts: Record<string, number> = {};
    
    // Count each reaction type
    data.forEach(reaction => {
      if (!counts[reaction.type]) {
        counts[reaction.type] = 0;
      }
      counts[reaction.type]++;
    });
    
    return counts;
  }

  /**
   * Create a new follow relationship
   */
  async createFollow(
    followerId: string,
    followedId: string,
    transaction?: SupabaseClient
  ): Promise<Follow> {
    const db = transaction || this.db;
    
    const { data, error } = await db
      .from('follows')
      .insert({
        followerId,
        followedId,
        createdAt: new Date()
      })
      .select()
      .single();
    
    if (error) {
      this.logger.error(error, `Failed to create follow relationship between ${followerId} and ${followedId}`);
      throw new Error(`Failed to create follow relationship: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Remove a follow relationship
   */
  async deleteFollow(
    followerId: string,
    followedId: string,
    transaction?: SupabaseClient
  ): Promise<void> {
    const db = transaction || this.db;
    
    const { error } = await db
      .from('follows')
      .delete()
      .eq('followerId', followerId)
      .eq('followedId', followedId);
    
    if (error) {
      this.logger.error(error, `Failed to delete follow relationship between ${followerId} and ${followedId}`);
      throw new Error(`Failed to delete follow relationship: ${error.message}`);
    }
  }

  /**
   * Check if user follows another user
   */
  async checkFollowExists(
    followerId: string,
    followedId: string
  ): Promise<boolean> {
    const { data, error } = await this.db
      .from('follows')
      .select('id')
      .eq('followerId', followerId)
      .eq('followedId', followedId)
      .maybeSingle();
    
    if (error) {
      this.logger.error(error, `Failed to check follow relationship between ${followerId} and ${followedId}`);
      throw new Error(`Failed to check follow relationship: ${error.message}`);
    }
    
    return !!data;
  }

  /**
   * Get users following a specific user
   */
  async getUserFollowers(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ followers: Follow[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const { data, error, count } = await this.db
      .from('follows')
      .select('*, follower:user_profiles!followerId(id, username, displayName, imageUrl)', { count: 'exact' })
      .eq('followedId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      this.logger.error(error, `Failed to get followers for user ${userId}`);
      throw new Error(`Failed to get followers: ${error.message}`);
    }
    
    return {
      followers: data,
      total: count || 0
    };
  }

  /**
   * Get users that a specific user follows
   */
  async getUserFollowing(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ following: Follow[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const { data, error, count } = await this.db
      .from('follows')
      .select('*, followed:user_profiles!followedId(id, username, displayName, imageUrl)', { count: 'exact' })
      .eq('followerId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      this.logger.error(error, `Failed to get following for user ${userId}`);
      throw new Error(`Failed to get following: ${error.message}`);
    }
    
    return {
      following: data,
      total: count || 0
    };
  }

  /**
   * Get follow counts for a user
   */
  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    // Get follower count
    const { count: followerCount, error: followerError } = await this.db
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('followedId', userId);
    
    if (followerError) {
      this.logger.error(followerError, `Failed to get follower count for user ${userId}`);
      throw new Error(`Failed to get follower count: ${followerError.message}`);
    }
    
    // Get following count
    const { count: followingCount, error: followingError } = await this.db
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('followerId', userId);
    
    if (followingError) {
      this.logger.error(followingError, `Failed to get following count for user ${userId}`);
      throw new Error(`Failed to get following count: ${followingError.message}`);
    }
    
    return {
      followers: followerCount || 0,
      following: followingCount || 0
    };
  }
  
  /**
   * Get suggested users to follow based on network graph (users followed by people the user follows)
   */
  async getSuggestedUsersByNetwork(
    userId: string,
    excludeIds: string[] = [],
    options: { limit?: number } = {}
  ): Promise<any[]> {
    const limit = options.limit || 10;
    
    // This query finds users who are followed by people the user follows (network graph)
    const queryParams = [userId];
    let excludeIdsList = '';
    
    if (excludeIds.length > 0) {
      excludeIds.forEach((id, index) => {
        queryParams.push(id);
        excludeIdsList += index === 0 ? `${index + 2}` : `, ${index + 2}`;
      });
    }
    
    queryParams.push(limit);
    const limitParam = queryParams.length;
    
    const { data, error } = await this.db.query(`
      WITH user_following AS (
        SELECT followed_id 
        FROM follows 
        WHERE follower_id = $1
      )
      SELECT 
        p.id, 
        p.username, 
        p.display_name as "displayName", 
        p.image_url as "imageUrl",
        COUNT(f.follower_id) as common_connections
      FROM follows f
      JOIN user_profiles p ON f.followed_id = p.id
      WHERE 
        f.follower_id IN (SELECT followed_id FROM user_following)
        AND f.followed_id != $1
        AND f.followed_id NOT IN (SELECT followed_id FROM user_following)
        ${excludeIds.length > 0 ? `AND f.followed_id NOT IN (${excludeIdsList})` : ''}
      GROUP BY p.id, p.username, p.display_name, p.image_url
      ORDER BY common_connections DESC
      LIMIT ${limitParam}
    `, queryParams);
    
    if (error) {
      this.logger.error(error, `Failed to get suggested users for ${userId}`);
      throw new Error(`Failed to get suggested users: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Get popular creators as suggestions
   */
  async getPopularCreators(
    excludeIds: string[] = [],
    options: { limit?: number } = {}
  ): Promise<any[]> {
    const limit = options.limit || 10;
    const queryParams = [];
    let excludeIdsList = '';
    
    if (excludeIds.length > 0) {
      excludeIds.forEach((id, index) => {
        queryParams.push(id);
        excludeIdsList += index === 0 ? `${index + 1}` : `, ${index + 1}`;
      });
    }
    
    queryParams.push(limit);
    const limitParam = queryParams.length;
    
    // This query finds users with the most followers who aren't in the exclude list
    const { data, error } = await this.db.query(`
      SELECT 
        p.id, 
        p.username, 
        p.display_name as "displayName", 
        p.image_url as "imageUrl",
        COUNT(f.follower_id) as follower_count
      FROM user_profiles p
      LEFT JOIN follows f ON p.id = f.followed_id
      WHERE 
        ${excludeIds.length > 0 ? `p.id NOT IN (${excludeIdsList}) AND` : ''}
        p.is_creator = true
      GROUP BY p.id, p.username, p.display_name, p.image_url
      ORDER BY follower_count DESC, p.created_at DESC
      LIMIT ${limitParam}
    `, queryParams);
    
    if (error) {
      this.logger.error(error, 'Failed to get popular creators');
      throw new Error(`Failed to get popular creators: ${error.message}`);
    }
    
    return data || [];
  }
}
