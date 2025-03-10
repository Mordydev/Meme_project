import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { Interest } from '../models/social';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository for handling user interests
 */
export class InterestRepository extends BaseRepository<Interest> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'user_interests');
  }

  /**
   * Get interests for a user
   */
  async getUserInterests(userId: string): Promise<Interest[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('userId', userId)
      .order('score', { ascending: false });
    
    if (error) {
      this.logger.error(error, `Failed to get interests for user ${userId}`);
      throw new Error(`Failed to get user interests: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Add or update user interest
   */
  async upsertInterest(
    interest: Omit<Interest, 'id' | 'createdAt' | 'updatedAt'>,
    transaction?: SupabaseClient
  ): Promise<Interest> {
    const db = transaction || this.db;
    
    // Check if interest exists
    const { data: existingInterest } = await db
      .from(this.tableName)
      .select('id')
      .eq('userId', interest.userId)
      .eq('interest', interest.interest)
      .maybeSingle();
    
    const now = new Date();
    
    if (existingInterest) {
      // Update existing interest
      const { data, error } = await db
        .from(this.tableName)
        .update({
          score: interest.score,
          source: interest.source,
          updatedAt: now
        })
        .eq('id', existingInterest.id)
        .select()
        .single();
      
      if (error) {
        this.logger.error(error, `Failed to update interest ${interest.interest} for user ${interest.userId}`);
        throw new Error(`Failed to update interest: ${error.message}`);
      }
      
      return data;
    } else {
      // Create new interest
      const { data, error } = await db
        .from(this.tableName)
        .insert({
          ...interest,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();
      
      if (error) {
        this.logger.error(error, `Failed to create interest ${interest.interest} for user ${interest.userId}`);
        throw new Error(`Failed to create interest: ${error.message}`);
      }
      
      return data;
    }
  }

  /**
   * Delete user interest
   */
  async deleteInterest(
    userId: string, 
    interest: string,
    transaction?: SupabaseClient
  ): Promise<void> {
    const db = transaction || this.db;
    
    const { error } = await db
      .from(this.tableName)
      .delete()
      .eq('userId', userId)
      .eq('interest', interest);
    
    if (error) {
      this.logger.error(error, `Failed to delete interest ${interest} for user ${userId}`);
      throw new Error(`Failed to delete interest: ${error.message}`);
    }
  }

  /**
   * Get users with specific interest
   */
  async getUsersByInterest(
    interest: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ users: { userId: string; score: number }[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('userId, score, user:user_profiles!userId(username, displayName, imageUrl)', { count: 'exact' })
      .eq('interest', interest)
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      this.logger.error(error, `Failed to get users for interest ${interest}`);
      throw new Error(`Failed to get users by interest: ${error.message}`);
    }
    
    return {
      users: data,
      total: count || 0
    };
  }

  /**
   * Get popular interests
   */
  async getPopularInterests(limit = 20): Promise<{ interest: string; count: number }[]> {
    const { data, error } = await this.db.rpc('get_popular_interests', { limit_count: limit });
    
    if (error) {
      this.logger.error(error, 'Failed to get popular interests');
      throw new Error(`Failed to get popular interests: ${error.message}`);
    }
    
    return data || [];
  }
}
