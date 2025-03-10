import { FastifyInstance } from 'fastify';
import { ContentRepository } from '../repositories/content-repository';
import { EventEmitter, EventType } from '../lib/events';
import { AIModerationService } from './ai-moderation-service';
import { NotFoundError, AppError } from '../lib/errors';

/**
 * Moderation decision type
 */
export type ModerationDecision = 'approved' | 'rejected' | 'escalated';

/**
 * Content moderation flag
 */
export interface ContentModerationFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  details?: Record<string, any>;
}

/**
 * Moderation repository interface
 */
export interface ModerationRepository {
  addToReviewQueue(contentId: string, priority: number): Promise<void>;
  getQueuedItems(limit: number): Promise<{ contentId: string; priority: number }[]>;
  removeFromQueue(contentId: string): Promise<void>;
  logModerationAction(action: {
    contentId: string;
    moderatorId: string;
    decision: ModerationDecision;
    reason?: string;
    flags?: ContentModerationFlag[];
  }): Promise<void>;
  getModerationLog(contentId: string): Promise<{
    moderatorId: string;
    decision: ModerationDecision;
    timestamp: Date;
    reason?: string;
    flags?: ContentModerationFlag[];
  }[]>;
}

/**
 * Service for content moderation
 */
export class ModerationService {
  constructor(
    private fastify: FastifyInstance,
    private contentRepository: ContentRepository,
    private moderationRepository: ModerationRepository,
    private aiModerationService: AIModerationService,
    private eventEmitter: EventEmitter
  ) {
    // Subscribe to content creation events
    this.eventEmitter.on(EventType.CONTENT_CREATED, this.handleContentCreated);
  }

  /**
   * Handle content created event
   */
  private handleContentCreated = async (data: any) => {
    try {
      // Get content
      const content = await this.contentRepository.findById(data.contentId);
      if (!content) return;
      
      // Don't moderate battle entries (handled by battle moderation)
      if (content.battleId) return;
      
      // Perform AI-based pre-moderation
      const moderationResult = await this.aiModerationService.analyzeContent(content);
      
      if (moderationResult.confidence > 0.9) {
        // Auto-approve or reject based on high confidence
        await this.moderateContent(
          content.id,
          'system',
          moderationResult.decision,
          `Auto-moderation: ${moderationResult.reason}`,
          moderationResult.flags
        );
      } else if (moderationResult.confidence > 0.7) {
        // Update content with moderation flags for human review
        await this.contentRepository.update(content.id, {
          moderation: {
            status: 'flagged',
            flags: moderationResult.flags,
            confidence: moderationResult.confidence
          }
        });
        
        // Add to human review queue with priority based on factors
        const priority = this.calculatePriority(content, moderationResult);
        await this.moderationRepository.addToReviewQueue(content.id, priority);
      } else {
        // Low-confidence case - treat as pending but lower priority
        await this.moderationRepository.addToReviewQueue(content.id, 1);
      }
    } catch (error) {
      // Log error but don't fail
      this.fastify.log.error({ error, contentId: data.contentId }, 'Auto-moderation error');
    }
  };

  /**
   * Calculate review priority based on content and moderation result
   */
  private calculatePriority(content: any, moderationResult: any): number {
    let priority = 5; // Base priority
    
    // Increase based on flag severity
    const hasSevereFlag = moderationResult.flags.some((f: any) => f.severity === 'high');
    if (hasSevereFlag) priority += 5;
    
    // Increase based on content visibility/reach
    const isHighImpact = content.creatorId && content.metrics.viewCount > 100;
    if (isHighImpact) priority += 3;
    
    // Adjust based on confidence
    priority += Math.floor(moderationResult.confidence * 5);
    
    return Math.min(Math.max(priority, 1), 10); // Ensure between 1-10
  }

  /**
   * Moderate content with a decision
   */
  async moderateContent(
    contentId: string,
    moderatorId: string,
    decision: ModerationDecision,
    reason?: string,
    flags?: ContentModerationFlag[]
  ): Promise<void> {
    // Validate content exists
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundError('content', contentId);
    }
    
    // Apply moderation decision
    const moderationUpdate = {
      status: decision === 'escalated' ? 'flagged' : decision,
      reviewerId: moderatorId,
      reviewedAt: new Date(),
      reason: reason,
      flags: flags || []
    };
    
    // If rejected, change content status
    const contentUpdate: any = {
      moderation: moderationUpdate
    };
    
    if (decision === 'rejected') {
      contentUpdate.status = 'removed';
    }
    
    // Update content with moderation decision
    await this.contentRepository.update(contentId, contentUpdate);
    
    // Remove from queue if not escalated
    if (decision !== 'escalated') {
      await this.moderationRepository.removeFromQueue(contentId);
    }
    
    // Log moderation action
    await this.moderationRepository.logModerationAction({
      contentId,
      moderatorId,
      decision,
      reason,
      flags
    });
    
    // Emit event
    await this.eventEmitter.emit(EventType.CONTENT_MODERATED, {
      contentId,
      moderatorId,
      decision,
      timestamp: new Date().toISOString()
    });
    
    // If rejected, notify creator
    if (decision === 'rejected' && content.creatorId) {
      await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
        userId: content.creatorId,
        type: 'content_rejected',
        data: {
          contentId,
          reason: reason || 'Content policy violation'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get content for moderation review
   */
  async getContentForReview(limit = 10): Promise<any[]> {
    // Get items from queue
    const queueItems = await this.moderationRepository.getQueuedItems(limit);
    
    if (queueItems.length === 0) {
      return [];
    }
    
    // Get content details
    const contentIds = queueItems.map(item => item.contentId);
    const contentItems = await Promise.all(
      contentIds.map(async (id) => {
        try {
          return await this.contentRepository.findById(id);
        } catch (error) {
          this.fastify.log.error({ error, contentId: id }, 'Error fetching content for moderation');
          return null;
        }
      })
    );
    
    // Filter out null items and add priority
    return contentItems
      .filter(Boolean)
      .map((content, index) => ({
        ...content,
        moderationPriority: queueItems[index].priority
      }));
  }

  /**
   * Get content moderation history
   */
  async getContentModerationHistory(contentId: string): Promise<any[]> {
    // Check if content exists
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundError('content', contentId);
    }
    
    // Get moderation log
    return this.moderationRepository.getModerationLog(contentId);
  }

  /**
   * Appeal content moderation decision
   */
  async appealModeration(
    contentId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    // Check if content exists and belongs to user
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundError('content', contentId);
    }
    
    if (content.creatorId !== userId) {
      throw AppError.forbidden('You do not have permission to appeal this moderation decision');
    }
    
    // Check if content was rejected
    if (content.moderation.status !== 'rejected') {
      throw AppError.validation('Only rejected content can be appealed');
    }
    
    // Add to review queue with high priority for re-review
    await this.moderationRepository.addToReviewQueue(contentId, 9);
    
    // Update moderation status to indicate appeal
    await this.contentRepository.update(contentId, {
      moderation: {
        ...content.moderation,
        status: 'flagged',
        appealedAt: new Date(),
        appealReason: reason
      }
    });
    
    // Log appeal action
    await this.moderationRepository.logModerationAction({
      contentId,
      moderatorId: userId,
      decision: 'escalated',
      reason: `Appeal: ${reason}`
    });
    
    // Emit event
    await this.eventEmitter.emit(EventType.CONTENT_MODERATION_APPEALED, {
      contentId,
      userId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Report content for moderation
   */
  async reportContent(
    contentId: string,
    reporterId: string,
    reason: string,
    details?: Record<string, any>
  ): Promise<void> {
    // Check if content exists
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundError('content', contentId);
    }
    
    // Update moderation info if not already in moderation
    if (content.moderation.status !== 'rejected') {
      await this.contentRepository.update(contentId, {
        moderation: {
          ...content.moderation,
          status: 'flagged',
          reportCount: (content.moderation.reportCount || 0) + 1
        }
      });
    }
    
    // Add to review queue with priority based on report severity
    // Priority based on report type and previous reports
    const priority = 5 + Math.min((content.moderation.reportCount || 0), 4);
    await this.moderationRepository.addToReviewQueue(contentId, priority);
    
    // Log report action
    await this.moderationRepository.logModerationAction({
      contentId,
      moderatorId: reporterId,
      decision: 'escalated',
      reason: `User report: ${reason}`,
      flags: [
        {
          type: 'user_report',
          severity: 'medium',
          confidence: 0.8,
          details: details
        }
      ]
    });
    
    // Emit event
    await this.eventEmitter.emit(EventType.CONTENT_REPORTED, {
      contentId,
      reporterId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get community guidelines
   */
  async getCommunityGuidelines(): Promise<any> {
    // In a real implementation, this would be fetched from a database
    // For now, we return a hardcoded object
    return {
      version: '1.0',
      lastUpdated: '2023-01-01',
      sections: [
        {
          title: 'General Guidelines',
          rules: [
            'Be respectful to other users',
            'No hate speech or harassment',
            'No illegal content',
            'No spamming or excessive self-promotion',
            'Credit original creators when sharing their work'
          ]
        },
        {
          title: 'Content Guidelines',
          rules: [
            'Keep content appropriate for a diverse audience',
            'No explicit sexual content',
            'No graphic violence',
            'No content that glorifies harmful behaviors',
            'Respect intellectual property rights'
          ]
        },
        {
          title: 'Battle-Specific Guidelines',
          rules: [
            'Competitive humor is encouraged, but attacks on personal traits are not',
            'Jokes should punch up, not down',
            'Creative expression is valued, but offensive content for shock value is not',
            'Give constructive feedback when voting',
            'Have fun while keeping it respectful'
          ]
        }
      ]
    };
  }
}
