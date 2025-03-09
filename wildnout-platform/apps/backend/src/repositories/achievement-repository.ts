import { FastifyInstance } from 'fastify';
import { 
  AchievementModel, 
  UserAchievementModel, 
  defaultAchievements,
  AchievementRule
} from '../models/achievement';
import { EventEmitter, EventType } from '../lib/events';
import { TransactionManager } from '../lib/transaction';

/**
 * Repository for handling achievement data
 */
export class AchievementRepository {
  constructor(
    private fastify: FastifyInstance,
    private eventEmitter?: EventEmitter,
    private transactionManager?: TransactionManager
  ) {}

  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<AchievementModel[]> {
    const { data, error } = await this.fastify.supabase
      .from('achievements')
      .select('*')
      .order('category')
      .order('tier');
    
    if (error) {
      this.fastify.log.error(error, 'Failed to get achievements');
      throw new Error('Failed to get achievements');
    }
    
    return data;
  }

  /**
   * Get achievement by id
   */
  async getAchievementById(id: string): Promise<AchievementModel | null> {
    const { data, error } = await this.fastify.supabase
      .from('achievements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      
      this.fastify.log.error(error, `Failed to get achievement with id ${id}`);
      throw new Error(`Failed to get achievement with id ${id}`);
    }
    
    return data;
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(category: string): Promise<AchievementModel[]> {
    const { data, error } = await this.fastify.supabase
      .from('achievements')
      .select('*')
      .eq('category', category)
      .order('tier');
    
    if (error) {
      this.fastify.log.error(error, `Failed to get achievements for category ${category}`);
      throw new Error(`Failed to get achievements for category ${category}`);
    }
    
    return data;
  }

  /**
   * Get achievements by rule ID
   */
  async getAchievementsByRuleId(ruleId: string): Promise<AchievementModel[]> {
    const { data, error } = await this.fastify.supabase
      .from('achievements')
      .select('*')
      .eq('rule_id', ruleId)
      .order('points_reward'); // Order by points to have lower tiers first
    
    if (error) {
      this.fastify.log.error(error, `Failed to get achievements for rule ${ruleId}`);
      throw new Error(`Failed to get achievements for rule ${ruleId}`);
    }
    
    return data;
  }

  /**
   * Get all user achievements
   */
  async getUserAchievements(userId: string): Promise<(UserAchievementModel & { achievement: AchievementModel })[]> {
    const { data, error } = await this.fastify.supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      this.fastify.log.error(error, `Failed to get achievements for user ${userId}`);
      throw new Error(`Failed to get achievements for user ${userId}`);
    }
    
    return data;
  }

  /**
   * Get specific user achievement
   */
  async getUserAchievement(userId: string, achievementId: string): Promise<(UserAchievementModel & { achievement: AchievementModel }) | null> {
    const { data, error } = await this.fastify.supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();
    
    if (error) {
      // If not found, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      
      this.fastify.log.error(error, `Failed to get achievement ${achievementId} for user ${userId}`);
      throw new Error(`Failed to get achievement ${achievementId} for user ${userId}`);
    }
    
    return data;
  }

  /**
   * Get user achievements by rule ID
   */
  async getUserAchievementsByRuleId(userId: string, ruleId: string): Promise<(UserAchievementModel & { achievement: AchievementModel })[]> {
    const { data, error } = await this.fastify.supabase.rpc('get_user_achievements_by_rule', {
      user_id_param: userId,
      rule_id_param: ruleId
    });
    
    if (error) {
      this.fastify.log.error(error, `Failed to get achievements for user ${userId} and rule ${ruleId}`);
      throw new Error(`Failed to get achievements for user ${userId} and rule ${ruleId}`);
    }
    
    return data;
  }

  /**
   * Get user achievement count
   */
  async getUserAchievementCount(userId: string): Promise<number> {
    const { count, error } = await this.fastify.supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('unlocked_at', 'is', null);
    
    if (error) {
      this.fastify.log.error(error, `Failed to get achievement count for user ${userId}`);
      throw new Error(`Failed to get achievement count for user ${userId}`);
    }
    
    return count || 0;
  }

  /**
   * Update user achievement progress
   */
  async updateAchievementProgress(
    userId: string, 
    achievementId: string, 
    progress: number,
    tx?: any
  ): Promise<UserAchievementModel> {
    // Start a transaction if not provided
    const transaction = tx || this.transactionManager ? 
      await this.transactionManager!.start() : undefined;
    
    try {
      // First check if the user achievement exists
      const existingAchievement = await this.getUserAchievement(userId, achievementId);
      
      let result;
      
      if (existingAchievement) {
        // If the achievement is already unlocked, don't update it
        if (existingAchievement.unlockedAt) {
          // If inside transaction, commit if we started it
          if (transaction && !tx) {
            await this.transactionManager!.commit(transaction);
          }
          
          return existingAchievement;
        }
        
        // Ensure progress doesn't decrease
        const newProgress = Math.max(existingAchievement.progress, progress);
        
        // Update existing achievement
        const query = this.fastify.supabase
          .from('user_achievements')
          .update({ 
            progress: newProgress,
            // If progress is 100%, unlock the achievement
            unlocked_at: newProgress >= 100 ? new Date() : null, 
            updated_at: new Date()
          })
          .eq('user_id', userId)
          .eq('achievement_id', achievementId)
          .select()
          .single();
        
        const { data, error } = transaction ? 
          await transaction.query(query) : await query;
        
        if (error) {
          throw error;
        }
        
        result = data;
        
        // If achievement was just unlocked
        if (newProgress >= 100 && !existingAchievement.unlockedAt) {
          // Get achievement details
          const achievement = await this.getAchievementById(achievementId);
          
          if (achievement && this.eventEmitter) {
            // Emit achievement unlocked event
            await this.eventEmitter.emit(EventType.ACHIEVEMENT_UNLOCKED, {
              userId,
              achievementId,
              achievementTitle: achievement.title,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        // Create new achievement tracking
        const query = this.fastify.supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress,
            unlocked_at: progress >= 100 ? new Date() : null,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single();
        
        const { data, error } = transaction ? 
          await transaction.query(query) : await query;
        
        if (error) {
          throw error;
        }
        
        result = data;
        
        // If achievement was unlocked immediately
        if (progress >= 100) {
          // Get achievement details
          const achievement = await this.getAchievementById(achievementId);
          
          if (achievement && this.eventEmitter) {
            // Emit achievement unlocked event
            await this.eventEmitter.emit(EventType.ACHIEVEMENT_UNLOCKED, {
              userId,
              achievementId,
              achievementTitle: achievement.title,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      // If we started the transaction, commit it
      if (transaction && !tx) {
        await this.transactionManager!.commit(transaction);
      }
      
      return result;
    } catch (error) {
      // If we started the transaction, roll it back
      if (transaction && !tx) {
        await this.transactionManager!.rollback(transaction);
      }
      
      this.fastify.log.error(error, `Failed to update achievement ${achievementId} for user ${userId}`);
      throw new Error(`Failed to update achievement ${achievementId} for user ${userId}`);
    }
  }

  /**
   * Update user achievement progress for a rule
   * This calculates the appropriate progress for each achievement level
   * within the rule
   */
  async updateAchievementProgressForRule(
    userId: string, 
    ruleId: string, 
    currentValue: number,
    tx?: any
  ): Promise<UserAchievementModel[]> {
    try {
      // Start a transaction if not provided
      const transaction = tx || this.transactionManager ? 
        await this.transactionManager!.start() : undefined;
      
      // Get achievements for this rule
      const achievements = await this.getAchievementsByRuleId(ruleId);
      
      if (achievements.length === 0) {
        this.fastify.log.warn(`No achievements found for rule ${ruleId}`);
        
        // If we started the transaction, commit it
        if (transaction && !tx) {
          await this.transactionManager!.commit(transaction);
        }
        
        return [];
      }
      
      // Get existing user achievements for this rule
      const existingAchievements = await this.getUserAchievementsByRuleId(userId, ruleId);
      
      // Update progress for each achievement
      const results: UserAchievementModel[] = [];
      
      for (const achievement of achievements) {
        const existingAchievement = existingAchievements.find(
          ua => ua.achievementId === achievement.id
        );
        
        // Skip if already unlocked
        if (existingAchievement?.unlockedAt) {
          results.push(existingAchievement);
          continue;
        }
        
        // Parse threshold from criteria
        const thresholdMatch = achievement.criteria.match(/\d+/);
        if (!thresholdMatch) {
          this.fastify.log.warn(`Could not parse threshold from criteria: ${achievement.criteria}`);
          continue;
        }
        
        const threshold = parseInt(thresholdMatch[0]);
        const progress = Math.min(100, Math.floor((currentValue / threshold) * 100));
        
        // Update progress for this achievement
        const updatedAchievement = await this.updateAchievementProgress(
          userId, 
          achievement.id, 
          progress,
          transaction
        );
        
        results.push(updatedAchievement);
      }
      
      // If we started the transaction, commit it
      if (transaction && !tx) {
        await this.transactionManager!.commit(transaction);
      }
      
      return results;
    } catch (error) {
      this.fastify.log.error(error, `Failed to update achievements for rule ${ruleId} and user ${userId}`);
      throw new Error(`Failed to update achievements for rule ${ruleId} and user ${userId}`);
    }
  }

  /**
   * Update progress for a rule based on criteria type and event data
   */
  async processEventForRules(
    eventType: EventType,
    eventData: any
  ): Promise<void> {
    // Get active rules for this event type
    const { data, error } = await this.fastify.supabase
      .from('achievement_rules')
      .select('*')
      .contains('event_types', [eventType]);
    
    if (error) {
      this.fastify.log.error(error, `Failed to get achievement rules for event ${eventType}`);
      throw new Error(`Failed to get achievement rules for event ${eventType}`);
    }
    
    // Process each rule
    for (const rule of data) {
      try {
        // Extract user ID from event data
        const userId = eventData.userId || eventData.creatorId || eventData.followerId;
        
        if (!userId) {
          this.fastify.log.warn(`No user ID found in event data for ${eventType}`);
          continue;
        }
        
        // Process rule based on criteria type
        switch (rule.criteria_type) {
          case 'battle_participation':
            await this.updateBattleParticipationProgress(userId, rule.id);
            break;
          
          case 'battle_wins':
            await this.updateBattleWinsProgress(userId, rule.id);
            break;
          
          case 'battle_type_wins':
            // Only update if this is a battle win event
            if (eventType === EventType.BATTLE_COMPLETED && eventData.winnerId === userId) {
              await this.updateBattleTypeWinsProgress(userId, rule.id, eventData.battleType);
            }
            break;
          
          case 'content_creation':
            await this.updateContentCreationProgress(userId, rule.id);
            break;
          
          case 'content_reactions':
            await this.updateContentReactionsProgress(userId, rule.id);
            break;
          
          case 'comment_creation':
            await this.updateCommentCreationProgress(userId, rule.id);
            break;
          
          case 'follower_count':
            await this.updateFollowerCountProgress(userId, rule.id);
            break;
          
          case 'following_count':
            await this.updateFollowingCountProgress(userId, rule.id);
            break;
          
          case 'token_holding':
            // Only update for token events
            if (eventType === EventType.WALLET_CONNECTED || 
                eventType === EventType.USER_BENEFITS_UPDATED) {
              await this.updateTokenHoldingProgress(userId, rule.id, eventData.holdings);
            }
            break;
          
          case 'achievement_count':
            // Only update if this is an achievement unlock event
            if (eventType === EventType.ACHIEVEMENT_UNLOCKED) {
              await this.updateAchievementCountProgress(userId, rule.id);
            }
            break;
          
          default:
            this.fastify.log.warn(`Unknown criteria type: ${rule.criteria_type}`);
        }
      } catch (error) {
        // Log but continue processing other rules
        this.fastify.log.error(error, `Error processing rule ${rule.id} for event ${eventType}`);
      }
    }
  }

  /**
   * Update battle participation progress
   */
  private async updateBattleParticipationProgress(userId: string, ruleId: string): Promise<void> {
    // Get current participation count
    const { count, error } = await this.fastify.supabase
      .from('battle_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update battle wins progress
   */
  private async updateBattleWinsProgress(userId: string, ruleId: string): Promise<void> {
    // Get current win count (rank 1)
    const { count, error } = await this.fastify.supabase
      .from('battle_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('rank', 1);
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update battle type wins progress
   */
  private async updateBattleTypeWinsProgress(userId: string, ruleId: string, battleType: string): Promise<void> {
    // Get current win count for this battle type
    const { count, error } = await this.fastify.supabase.rpc('count_battle_type_wins', {
      user_id_param: userId,
      battle_type_param: battleType
    });
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update content creation progress
   */
  private async updateContentCreationProgress(userId: string, ruleId: string): Promise<void> {
    // Get current content count
    const { count, error } = await this.fastify.supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .is('deleted_at', null);
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update content reactions progress
   */
  private async updateContentReactionsProgress(userId: string, ruleId: string): Promise<void> {
    // Get total reactions on user's content
    const { data, error } = await this.fastify.supabase.rpc('count_user_content_reactions', {
      user_id_param: userId
    });
    
    if (error) {
      throw error;
    }
    
    const count = data?.[0]?.reaction_count || 0;
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count);
  }

  /**
   * Update comment creation progress
   */
  private async updateCommentCreationProgress(userId: string, ruleId: string): Promise<void> {
    // Get current comment count
    const { count, error } = await this.fastify.supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .is('deleted_at', null);
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update follower count progress
   */
  private async updateFollowerCountProgress(userId: string, ruleId: string): Promise<void> {
    // Get current follower count
    const { count, error } = await this.fastify.supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userId);
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update following count progress
   */
  private async updateFollowingCountProgress(userId: string, ruleId: string): Promise<void> {
    // Get current following count
    const { count, error } = await this.fastify.supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    
    if (error) {
      throw error;
    }
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count || 0);
  }

  /**
   * Update token holding progress
   */
  private async updateTokenHoldingProgress(userId: string, ruleId: string, holdings: number): Promise<void> {
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, holdings || 0);
  }

  /**
   * Update achievement count progress
   */
  private async updateAchievementCountProgress(userId: string, ruleId: string): Promise<void> {
    // Get current achievement count
    const count = await this.getUserAchievementCount(userId);
    
    // Update achievement progress
    await this.updateAchievementProgressForRule(userId, ruleId, count);
  }

  /**
   * Initialize default achievements in the database
   * This should be called during server startup
   */
  async initializeAchievements(): Promise<void> {
    // Check if achievements exist
    const { count, error } = await this.fastify.supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      this.fastify.log.error(error, 'Failed to check achievements');
      throw new Error('Failed to check achievements');
    }
    
    // If no achievements exist, insert the defaults
    if (count === 0) {
      const { error } = await this.fastify.supabase
        .from('achievements')
        .insert(
          defaultAchievements.map(achievement => ({
            ...achievement,
            rule_id: achievement.ruleId,
            created_at: new Date(),
            updated_at: new Date()
          }))
        );
      
      if (error) {
        this.fastify.log.error(error, 'Failed to insert default achievements');
        throw new Error('Failed to insert default achievements');
      }
      
      this.fastify.log.info('Default achievements initialized');
    }
  }
}
