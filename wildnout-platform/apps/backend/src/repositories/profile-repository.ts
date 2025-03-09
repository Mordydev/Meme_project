import { FastifyInstance } from 'fastify';
import { UserProfileModel, calculateLevel, FollowModel } from '../models/user-profile';

/**
 * Repository for handling user profile data
 */
export class ProfileRepository {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Get a user profile by Clerk user ID
   */
  async getProfileByUserId(userId: string): Promise<UserProfileModel | null> {
    const { data, error } = await this.fastify.supabase
      .from('user_profiles')
      .select('*')
      .eq('userId', userId)
      .single();
    
    if (error) {
      // If not found, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      
      this.fastify.log.error(error, `Failed to get profile for user ${userId}`);
      throw new Error(`Failed to get profile for user ${userId}`);
    }
    
    return data;
  }

  /**
   * Get a user profile by username
   */
  async getProfileByUsername(username: string): Promise<UserProfileModel | null> {
    const { data, error } = await this.fastify.supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      // If not found, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      
      this.fastify.log.error(error, `Failed to get profile for username ${username}`);
      throw new Error(`Failed to get profile for username ${username}`);
    }
    
    return data;
  }

  /**
   * Create a new user profile
   */
  async createProfile(profile: Omit<UserProfileModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfileModel> {
    const { data, error } = await this.fastify.supabase
      .from('user_profiles')
      .insert({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .select()
      .single();
    
    if (error) {
      this.fastify.log.error(error, 'Failed to create user profile');
      throw new Error('Failed to create user profile');
    }
    
    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfileModel>): Promise<UserProfileModel> {
    const { data, error } = await this.fastify.supabase
      .from('user_profiles')
      .update({
        ...updates,
        updatedAt: new Date()
      })
      .eq('userId', userId)
      .select()
      .single();
    
    if (error) {
      this.fastify.log.error(error, `Failed to update profile for user ${userId}`);
      throw new Error(`Failed to update profile for user ${userId}`);
    }
    
    return data;
  }

  /**
   * Update user stats
   */
  async updateUserStats(userId: string, stats: Partial<UserProfileModel['stats']>): Promise<UserProfileModel> {
    // First get current profile
    const profile = await this.getProfileByUserId(userId);
    
    if (!profile) {
      throw new Error(`User profile not found for ${userId}`);
    }
    
    // Calculate new stats
    const newStats = {
      ...profile.stats,
      ...stats
    };
    
    // Update level based on points if points were updated
    if (stats.totalPoints !== undefined) {
      newStats.level = calculateLevel(newStats.totalPoints);
    }
    
    // Update the profile
    const { data, error } = await this.fastify.supabase
      .from('user_profiles')
      .update({
        stats: newStats,
        updatedAt: new Date()
      })
      .eq('userId', userId)
      .select()
      .single();
    
    if (error) {
      this.fastify.log.error(error, `Failed to update stats for user ${userId}`);
      throw new Error(`Failed to update stats for user ${userId}`);
    }
    
    return data;
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followedId: string): Promise<FollowModel> {
    // Check if already following
    const { data: existingFollow, error: checkError } = await this.fastify.supabase
      .from('user_follows')
      .select('*')
      .eq('followerId', followerId)
      .eq('followedId', followedId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      this.fastify.log.error(checkError, `Failed to check follow status for ${followerId} -> ${followedId}`);
      throw new Error(`Failed to check follow status for ${followerId} -> ${followedId}`);
    }
    
    // If already following, return existing relationship
    if (existingFollow) {
      return existingFollow;
    }
    
    // Create follow relationship
    const { data, error } = await this.fastify.supabase
      .from('user_follows')
      .insert({
        followerId,
        followedId,
        createdAt: new Date()
      })
      .select()
      .single();
    
    if (error) {
      this.fastify.log.error(error, `Failed to follow user ${followedId} for user ${followerId}`);
      throw new Error(`Failed to follow user ${followedId} for user ${followerId}`);
    }
    
    // Update follower counts for both users
    await Promise.all([
      this.incrementFollowerCount(followedId),
      this.incrementFollowingCount(followerId)
    ]);
    
    return data;
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    const { error } = await this.fastify.supabase
      .from('user_follows')
      .delete()
      .eq('followerId', followerId)
      .eq('followedId', followedId);
    
    if (error) {
      this.fastify.log.error(error, `Failed to unfollow user ${followedId} for user ${followerId}`);
      throw new Error(`Failed to unfollow user ${followedId} for user ${followerId}`);
    }
    
    // Update follower counts for both users
    await Promise.all([
      this.decrementFollowerCount(followedId),
      this.decrementFollowingCount(followerId)
    ]);
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const { data, error } = await this.fastify.supabase
      .from('user_follows')
      .select('id')
      .eq('followerId', followerId)
      .eq('followedId', followedId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.fastify.log.error(error, `Failed to check follow status for ${followerId} -> ${followedId}`);
      throw new Error(`Failed to check follow status for ${followerId} -> ${followedId}`);
    }
    
    return !!data;
  }

  /**
   * Get followers of a user
   */
  async getFollowers(userId: string, limit = 20, offset = 0): Promise<UserProfileModel[]> {
    const { data, error } = await this.fastify.supabase
      .from('user_follows')
      .select(`
        follower:user_profiles!followerId(*)
      `)
      .eq('followedId', userId)
      .range(offset, offset + limit - 1)
      .order('createdAt', { ascending: false });
    
    if (error) {
      this.fastify.log.error(error, `Failed to get followers for user ${userId}`);
      throw new Error(`Failed to get followers for user ${userId}`);
    }
    
    return data.map(item => item.follower);
  }

  /**
   * Get users followed by a user
   */
  async getFollowing(userId: string, limit = 20, offset = 0): Promise<UserProfileModel[]> {
    const { data, error } = await this.fastify.supabase
      .from('user_follows')
      .select(`
        followed:user_profiles!followedId(*)
      `)
      .eq('followerId', userId)
      .range(offset, offset + limit - 1)
      .order('createdAt', { ascending: false });
    
    if (error) {
      this.fastify.log.error(error, `Failed to get following for user ${userId}`);
      throw new Error(`Failed to get following for user ${userId}`);
    }
    
    return data.map(item => item.followed);
  }

  /**
   * Increment follower count for a user
   */
  private async incrementFollowerCount(userId: string): Promise<void> {
    const { error } = await this.fastify.supabase.rpc('increment_follower_count', { user_id: userId });
    
    if (error) {
      this.fastify.log.error(error, `Failed to increment follower count for user ${userId}`);
      throw new Error(`Failed to increment follower count for user ${userId}`);
    }
  }

  /**
   * Decrement follower count for a user
   */
  private async decrementFollowerCount(userId: string): Promise<void> {
    const { error } = await this.fastify.supabase.rpc('decrement_follower_count', { user_id: userId });
    
    if (error) {
      this.fastify.log.error(error, `Failed to decrement follower count for user ${userId}`);
      throw new Error(`Failed to decrement follower count for user ${userId}`);
    }
  }

  /**
   * Increment following count for a user
   */
  private async incrementFollowingCount(userId: string): Promise<void> {
    const { error } = await this.fastify.supabase.rpc('increment_following_count', { user_id: userId });
    
    if (error) {
      this.fastify.log.error(error, `Failed to increment following count for user ${userId}`);
      throw new Error(`Failed to increment following count for user ${userId}`);
    }
  }

  /**
   * Decrement following count for a user
   */
  private async decrementFollowingCount(userId: string): Promise<void> {
    const { error } = await this.fastify.supabase.rpc('decrement_following_count', { user_id: userId });
    
    if (error) {
      this.fastify.log.error(error, `Failed to decrement following count for user ${userId}`);
      throw new Error(`Failed to decrement following count for user ${userId}`);
    }
  }

  /**
   * Initialize a user profile when a new user is created
   */
  async initializeProfile(
    userId: string, 
    clerkData: { 
      firstName?: string; 
      lastName?: string; 
      username?: string;
      imageUrl?: string;
    }
  ): Promise<UserProfileModel> {
    // Check if profile already exists
    const existingProfile = await this.getProfileByUserId(userId);
    
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create new profile
    const displayName = [clerkData.firstName, clerkData.lastName].filter(Boolean).join(' ');
    
    return this.createProfile({
      userId,
      username: clerkData.username || `user${Date.now().toString().slice(-6)}`,
      displayName: displayName || 'New User',
      bio: '',
      imageUrl: clerkData.imageUrl || '',
      stats: {
        battleCount: 0,
        battleWins: 0,
        contentCount: 0,
        followerCount: 0,
        followingCount: 0,
        totalPoints: 0,
        level: 1
      },
      preferences: {
        notifications: true,
        privacy: 'public',
        theme: 'default'
      }
    });
  }
}
