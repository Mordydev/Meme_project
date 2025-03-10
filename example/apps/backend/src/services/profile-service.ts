import { FastifyInstance } from 'fastify';
import { ProfileRepository } from '../repositories/profile-repository';
import { AchievementRepository } from '../repositories/achievement-repository';
import { UserProfileModel } from '../models/user-profile';

/**
 * Service for handling user profile operations
 */
export class ProfileService {
  private profileRepository: ProfileRepository;
  private achievementRepository: AchievementRepository;
  
  constructor(private fastify: FastifyInstance) {
    this.profileRepository = new ProfileRepository(fastify);
    this.achievementRepository = new AchievementRepository(fastify);
  }

  /**
   * Get a user profile with achievements by user ID
   */
  async getUserProfile(userId: string) {
    // Get user profile
    const profile = await this.profileRepository.getProfileByUserId(userId);
    
    if (!profile) {
      return null;
    }
    
    // Get user achievements
    const achievements = await this.achievementRepository.getUserAchievements(userId);
    
    return {
      profile,
      achievements
    };
  }

  /**
   * Get a user profile with achievements by username
   */
  async getUserProfileByUsername(username: string) {
    // Get user profile
    const profile = await this.profileRepository.getProfileByUsername(username);
    
    if (!profile) {
      return null;
    }
    
    // Get user achievements
    const achievements = await this.achievementRepository.getUserAchievements(profile.userId);
    
    return {
      profile,
      achievements
    };
  }

  /**
   * Update a user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfileModel>) {
    // Make sure we don't update stats through this method
    const { stats, ...profileUpdates } = updates;
    
    // Update profile
    const updatedProfile = await this.profileRepository.updateProfile(userId, profileUpdates);
    
    return updatedProfile;
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followedId: string) {
    // Can't follow yourself
    if (followerId === followedId) {
      throw new Error('Cannot follow yourself');
    }
    
    return this.profileRepository.followUser(followerId, followedId);
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followedId: string) {
    return this.profileRepository.unfollowUser(followerId, followedId);
  }

  /**
   * Get followers of a user
   */
  async getFollowers(userId: string, limit = 20, offset = 0) {
    return this.profileRepository.getFollowers(userId, limit, offset);
  }

  /**
   * Get users followed by a user
   */
  async getFollowing(userId: string, limit = 20, offset = 0) {
    return this.profileRepository.getFollowing(userId, limit, offset);
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerId: string, followedId: string) {
    return this.profileRepository.isFollowing(followerId, followedId);
  }

  /**
   * Initialize a user profile when a new user is created
   */
  async initializeUserProfile(
    userId: string, 
    clerkData: { 
      firstName?: string; 
      lastName?: string; 
      username?: string;
      imageUrl?: string;
    }
  ) {
    const profile = await this.profileRepository.initializeProfile(userId, clerkData);
    
    // Also unlock the Community Member achievement for new users
    const communityMemberAchievement = (await this.achievementRepository.getAchievementsByCategory('community'))
      .find(a => a.title === 'Community Member');
    
    if (communityMemberAchievement) {
      await this.achievementRepository.updateAchievementProgress(
        userId, 
        communityMemberAchievement.id, 
        100
      );
    }
    
    return profile;
  }

  /**
   * Update user content count and unlock achievements if needed
   */
  async incrementContentCount(userId: string) {
    // Update content count
    const profile = await this.profileRepository.updateUserStats(userId, {
      contentCount: fastify.supabase.rpc('increment_content_count', { user_id: userId })
    });
    
    // Check for content achievements
    const contentAchievements = await this.achievementRepository.getAchievementsByCategory('content');
    
    // Check each achievement and update progress
    for (const achievement of contentAchievements) {
      if (achievement.title === 'Content Creator' && profile.stats.contentCount >= 1) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      } else if (achievement.title === 'Content Producer' && profile.stats.contentCount >= 10) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      } else if (achievement.title === 'Content Mogul' && profile.stats.contentCount >= 50) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      }
    }
    
    return profile;
  }

  /**
   * Update user battle count and unlock achievements if needed
   */
  async incrementBattleCount(userId: string) {
    // Update battle count
    const profile = await this.profileRepository.updateUserStats(userId, {
      battleCount: fastify.supabase.rpc('increment_battle_count', { user_id: userId })
    });
    
    // Check for battle achievements
    const battleAchievements = await this.achievementRepository.getAchievementsByCategory('battle');
    
    // Check each achievement and update progress
    for (const achievement of battleAchievements) {
      if (achievement.title === 'Battle Rookie' && profile.stats.battleCount >= 1) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      } else if (achievement.title === 'Battle Veteran' && profile.stats.battleCount >= 10) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      } else if (achievement.title === 'Battle Master' && profile.stats.battleCount >= 50) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      }
    }
    
    return profile;
  }

  /**
   * Update user battle wins and unlock achievements if needed
   */
  async incrementBattleWins(userId: string) {
    // Update battle wins
    const profile = await this.profileRepository.updateUserStats(userId, {
      battleWins: fastify.supabase.rpc('increment_battle_wins', { user_id: userId })
    });
    
    // Check for battle win achievements
    const battleAchievements = await this.achievementRepository.getAchievementsByCategory('battle');
    
    // Check each achievement and update progress
    for (const achievement of battleAchievements) {
      if (achievement.title === 'First Win' && profile.stats.battleWins >= 1) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      } else if (achievement.title === 'Champion' && profile.stats.battleWins >= 10) {
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, 100);
      }
    }
    
    return profile;
  }
}
