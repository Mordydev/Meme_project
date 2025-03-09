import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { ModerationDecision, ContentModerationFlag } from '../services/moderation-service';

/**
 * Moderation repository for handling content moderation data
 */
export class ModerationRepository extends BaseRepository<any> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'moderation_actions');
  }

  /**
   * Add content to moderation review queue
   */
  async addToReviewQueue(contentId: string, priority: number): Promise<void> {
    try {
      // Check if already in queue
      const { data: existing } = await this.db
        .from('moderation_queue')
        .select('id')
        .eq('contentId', contentId)
        .maybeSingle();
      
      if (existing) {
        // Update priority if already in queue
        await this.db
          .from('moderation_queue')
          .update({
            priority: priority,
            updatedAt: new Date()
          })
          .eq('id', existing.id);
      } else {
        // Add to queue
        await this.db
          .from('moderation_queue')
          .insert({
            contentId,
            priority,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
    } catch (error) {
      this.logger.error(error, `Failed to add content ${contentId} to moderation queue`);
      throw error;
    }
  }

  /**
   * Get items from the moderation queue
   */
  async getQueuedItems(limit: number): Promise<{ contentId: string; priority: number }[]> {
    try {
      const { data, error } = await this.db
        .from('moderation_queue')
        .select('contentId, priority')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: true })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      this.logger.error(error, 'Failed to get moderation queue items');
      throw error;
    }
  }

  /**
   * Remove content from moderation queue
   */
  async removeFromQueue(contentId: string): Promise<void> {
    try {
      await this.db
        .from('moderation_queue')
        .delete()
        .eq('contentId', contentId);
    } catch (error) {
      this.logger.error(error, `Failed to remove content ${contentId} from moderation queue`);
      throw error;
    }
  }

  /**
   * Log a moderation action
   */
  async logModerationAction(action: {
    contentId: string;
    moderatorId: string;
    decision: ModerationDecision;
    reason?: string;
    flags?: ContentModerationFlag[];
  }): Promise<void> {
    try {
      await this.db
        .from('moderation_actions')
        .insert({
          contentId: action.contentId,
          moderatorId: action.moderatorId,
          decision: action.decision,
          reason: action.reason,
          flags: action.flags,
          createdAt: new Date()
        });
    } catch (error) {
      this.logger.error(error, `Failed to log moderation action for content ${action.contentId}`);
      throw error;
    }
  }

  /**
   * Get moderation log for content
   */
  async getModerationLog(contentId: string): Promise<{
    moderatorId: string;
    decision: ModerationDecision;
    timestamp: Date;
    reason?: string;
    flags?: ContentModerationFlag[];
  }[]> {
    try {
      const { data, error } = await this.db
        .from('moderation_actions')
        .select('moderatorId, decision, reason, flags, createdAt')
        .eq('contentId', contentId)
        .order('createdAt', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map(item => ({
        moderatorId: item.moderatorId,
        decision: item.decision,
        timestamp: new Date(item.createdAt),
        reason: item.reason,
        flags: item.flags
      }));
    } catch (error) {
      this.logger.error(error, `Failed to get moderation log for content ${contentId}`);
      throw error;
    }
  }

  /**
   * Get content moderation statistics
   */
  async getModerationStats(): Promise<{
    totalModerated: number;
    approved: number;
    rejected: number;
    escalated: number;
    pendingQueue: number;
    averageTimeToModerate: number;
  }> {
    try {
      // Get counts by decision
      const { data: countsByDecision, error: countError } = await this.db
        .from('moderation_actions')
        .select('decision, count')
        .groupBy('decision');
      
      // Get pending queue count
      const { count: pendingCount, error: pendingError } = await this.db
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Get average moderation time
      // This would typically involve more complex queries
      // Simplified here by using a fixed value
      const averageTimeToModerateHours = 2.5;
      
      if (countError || pendingError) {
        throw countError || pendingError;
      }
      
      // Map counts by decision
      const counts = {
        approved: 0,
        rejected: 0,
        escalated: 0
      };
      
      countsByDecision?.forEach(item => {
        if (item.decision in counts) {
          counts[item.decision as keyof typeof counts] = item.count;
        }
      });
      
      return {
        totalModerated: counts.approved + counts.rejected + counts.escalated,
        approved: counts.approved,
        rejected: counts.rejected,
        escalated: counts.escalated,
        pendingQueue: pendingCount || 0,
        averageTimeToModerate: averageTimeToModerateHours
      };
    } catch (error) {
      this.logger.error(error, 'Failed to get moderation statistics');
      throw error;
    }
  }
}
