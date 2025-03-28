/**
 * Moderation Service
 * 
 * Handles content moderation, filtering, and reporting
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { ReportRepository } from '../../repositories/report-repository';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { 
  Report, 
  CreateReportDto, 
  UpdateReportDto,
  ReportWithDetails,
  ReportResolutionDto,
  ReportStatus
} from '../../models/entities/moderation/report.model';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../../errors';

/**
 * Moderation check result
 */
export interface ModerationResult {
  requiresModeration: boolean;
  reason?: string;
  confidence: number;
}

/**
 * Moderation resolution result
 */
export interface ResolutionResult {
  success: boolean;
  report: Report;
  affectedEntity?: any;
}

/**
 * Service for handling content moderation
 */
export class ModerationService {
  /**
   * Create a new ModerationService
   * 
   * @param reportRepository Repository for report data
   * @param contentRepository Repository for content data
   * @param commentRepository Repository for comment data
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private reportRepository: ReportRepository,
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Report content, comment, or user
   * 
   * @param reportData Report data
   * @returns Created report
   */
  async createReport(reportData: CreateReportDto): Promise<Report> {
    try {
      // Validate entity exists based on type
      await this.validateEntityExists(reportData.entity_type, reportData.entity_id);
      
      // Check if user has already reported this entity
      const hasReported = await this.reportRepository.hasUserReported(
        reportData.reporter_id,
        reportData.entity_type,
        reportData.entity_id
      );
      
      if (hasReported) {
        throw new ValidationError('You have already reported this item');
      }
      
      // Create the report
      const report = await this.reportRepository.createReport(reportData);
      
      // Emit report created event
      await this.eventBus.publish(EventType.REPORT_CREATED, {
        reportId: report.id,
        entityType: report.entity_type,
        entityId: report.entity_id,
        reason: report.reason
      });
      
      logger.info(`User ${reportData.reporter_id} reported ${reportData.entity_type} ${reportData.entity_id} for ${reportData.reason}`);
      return report;
    } catch (error) {
      logger.error('Error creating report', { error, reportData });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to create report: ${error.message}`);
    }
  }

  /**
   * Get moderation queue with report details
   * 
   * @param options Query options
   * @returns Array of reports with details
   */
  async getModerationQueue(options: {
    status?: ReportStatus;
    entityType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ReportWithDetails[]> {
    try {
      return await this.reportRepository.getReportsWithDetails(options);
    } catch (error) {
      logger.error('Error getting moderation queue', { error, options });
      throw error;
    }
  }

  /**
   * Update report status
   * 
   * @param reportId Report ID
   * @param status New status
   * @returns Updated report
   */
  async updateReportStatus(reportId: string, status: ReportStatus): Promise<Report | null> {
    try {
      // Get existing report
      const report = await this.reportRepository.findById(reportId);
      if (!report) {
        throw new NotFoundError('Report', reportId);
      }
      
      // Update status
      return await this.reportRepository.updateReport(reportId, { status });
    } catch (error) {
      logger.error('Error updating report status', { error, reportId, status });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to update report status: ${error.message}`);
    }
  }

  /**
   * Resolve a report with action
   * 
   * @param reportId Report ID
   * @param moderatorId Moderator user ID
   * @param resolution Resolution data
   * @returns Resolution result
   */
  async resolveReport(
    reportId: string, 
    moderatorId: string, 
    resolution: ReportResolutionDto
  ): Promise<ResolutionResult> {
    try {
      // Get existing report
      const report = await this.reportRepository.findById(reportId);
      if (!report) {
        throw new NotFoundError('Report', reportId);
      }
      
      // Check if report already resolved
      if (report.status === 'resolved' || report.status === 'rejected') {
        throw new ValidationError(`Report already ${report.status}`);
      }
      
      // Update report with resolution
      const updatedReport = await this.reportRepository.updateReport(reportId, {
        status: 'resolved',
        moderator_id: moderatorId,
        resolution_action: resolution.resolution_action,
        resolution_notes: resolution.resolution_notes,
        resolved_at: new Date()
      });
      
      // Take action on the entity if needed
      let affectedEntity = null;
      if (resolution.resolution_action !== 'no_action') {
        affectedEntity = await this.applyModerationAction(
          report.entity_type, 
          report.entity_id, 
          resolution.resolution_action
        );
      }
      
      // Emit report resolved event
      await this.eventBus.publish(EventType.REPORT_RESOLVED, {
        reportId,
        moderatorId,
        resolution: resolution.resolution_action,
        entityType: report.entity_type,
        entityId: report.entity_id
      });
      
      logger.info(`Moderator ${moderatorId} resolved report ${reportId} with action ${resolution.resolution_action}`);
      
      return {
        success: true,
        report: updatedReport!,
        affectedEntity
      };
    } catch (error) {
      logger.error('Error resolving report', { error, reportId, moderatorId, resolution });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to resolve report: ${error.message}`);
    }
  }

  /**
   * Reject a report
   * 
   * @param reportId Report ID
   * @param moderatorId Moderator user ID
   * @param notes Optional rejection notes
   * @returns Updated report
   */
  async rejectReport(
    reportId: string, 
    moderatorId: string, 
    notes?: string
  ): Promise<Report | null> {
    try {
      // Get existing report
      const report = await this.reportRepository.findById(reportId);
      if (!report) {
        throw new NotFoundError('Report', reportId);
      }
      
      // Check if report already resolved
      if (report.status === 'resolved' || report.status === 'rejected') {
        throw new ValidationError(`Report already ${report.status}`);
      }
      
      // Update report as rejected
      const updatedReport = await this.reportRepository.updateReport(reportId, {
        status: 'rejected',
        moderator_id: moderatorId,
        resolution_notes: notes,
        resolved_at: new Date()
      });
      
      // Emit report rejected event
      await this.eventBus.publish(EventType.REPORT_REJECTED, {
        reportId,
        moderatorId,
        entityType: report.entity_type,
        entityId: report.entity_id
      });
      
      logger.info(`Moderator ${moderatorId} rejected report ${reportId}`);
      return updatedReport;
    } catch (error) {
      logger.error('Error rejecting report', { error, reportId, moderatorId });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to reject report: ${error.message}`);
    }
  }

  /**
   * Get report counts by status
   * 
   * @returns Counts by status
   */
  async getReportCounts(): Promise<Record<ReportStatus, number>> {
    try {
      return await this.reportRepository.countReportsByStatus();
    } catch (error) {
      logger.error('Error getting report counts', { error });
      throw error;
    }
  }

  /**
   * Check content for moderation issues
   * 
   * @param contentData Content data
   * @returns Moderation result
   */
  async checkContent(contentData: any): Promise<ModerationResult> {
    try {
      // Check content text for prohibited content
      if (contentData.content_text) {
        const textResult = this.checkForProhibitedText(contentData.content_text);
        if (textResult.detected) {
          return {
            requiresModeration: true,
            reason: `Potentially ${textResult.category} content detected`,
            confidence: textResult.confidence
          };
        }
      }
      
      // Check link URL if present
      if (contentData.type === 'link' && contentData.link_url) {
        const urlResult = this.checkLinkSafety(contentData.link_url);
        if (!urlResult.safe) {
          return {
            requiresModeration: true,
            reason: `Potentially unsafe link: ${urlResult.reason}`,
            confidence: urlResult.confidence
          };
        }
      }
      
      // More checks could be added here, such as image analysis
      
      // Default to not requiring moderation
      return {
        requiresModeration: false,
        confidence: 1.0
      };
    } catch (error) {
      logger.error('Error checking content for moderation', { error, contentData });
      
      // Default to requiring moderation if check fails
      return {
        requiresModeration: true,
        reason: 'Error during moderation check',
        confidence: 0.5
      };
    }
  }

  /**
   * Check comment for moderation issues
   * 
   * @param commentData Comment data
   * @returns Moderation result
   */
  async checkComment(commentData: any): Promise<ModerationResult> {
    try {
      // Check comment text for prohibited content
      if (commentData.comment_text) {
        const textResult = this.checkForProhibitedText(commentData.comment_text);
        if (textResult.detected) {
          return {
            requiresModeration: true,
            reason: `Potentially ${textResult.category} content detected`,
            confidence: textResult.confidence
          };
        }
      }
      
      // Default to not requiring moderation
      return {
        requiresModeration: false,
        confidence: 1.0
      };
    } catch (error) {
      logger.error('Error checking comment for moderation', { error, commentData });
      
      // Default to requiring moderation if check fails
      return {
        requiresModeration: true,
        reason: 'Error during moderation check',
        confidence: 0.5
      };
    }
  }

  /**
   * Check if entity exists
   * 
   * @param entityType Entity type (content, comment, user)
   * @param entityId Entity ID
   */
  private async validateEntityExists(entityType: string, entityId: string): Promise<void> {
    if (entityType === 'content') {
      const content = await this.contentRepository.findById(entityId);
      if (!content) {
        throw new NotFoundError('Content', entityId);
      }
    } else if (entityType === 'comment') {
      const comment = await this.commentRepository.findById(entityId);
      if (!comment) {
        throw new NotFoundError('Comment', entityId);
      }
    } else if (entityType === 'user') {
      // User validation would need a userRepository
      // For now, we'll assume it exists
    } else {
      throw new ValidationError(`Invalid entity type: ${entityType}`);
    }
  }

  /**
   * Apply moderation action to entity
   * 
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param action Action to take
   * @returns Affected entity
   */
  private async applyModerationAction(
    entityType: string, 
    entityId: string, 
    action: string
  ): Promise<any> {
    if (entityType === 'content' && (action === 'content_removed' || action === 'warning')) {
      const content = await this.contentRepository.findById(entityId);
      if (!content) {
        throw new NotFoundError('Content', entityId);
      }
      
      if (action === 'content_removed') {
        // Soft delete the content
        await this.contentRepository.softDeleteContent(entityId);
        
        // Emit content moderated event
        await this.eventBus.publish(EventType.CONTENT_MODERATED, {
          contentId: entityId,
          userId: content.user_id,
          action: 'removed'
        });
      }
      
      return content;
    } else if (entityType === 'comment' && (action === 'comment_removed' || action === 'warning')) {
      const comment = await this.commentRepository.findById(entityId);
      if (!comment) {
        throw new NotFoundError('Comment', entityId);
      }
      
      if (action === 'comment_removed') {
        // Soft delete the comment
        await this.commentRepository.softDeleteComment(entityId);
        
        // Emit comment moderated event
        await this.eventBus.publish(EventType.COMMENT_MODERATED, {
          commentId: entityId,
          userId: comment.user_id,
          action: 'removed'
        });
      }
      
      return comment;
    } else if (entityType === 'user' && (action === 'user_suspended' || action === 'user_banned' || action === 'warning')) {
      // User moderation would need a userService
      // For now, just return the user ID
      return { id: entityId };
    }
    
    return null;
  }

  /**
   * Check text for prohibited content
   * 
   * @param text Text to check
   * @returns Check result
   */
  private checkForProhibitedText(text: string): { 
    detected: boolean; 
    category?: string; 
    confidence: number 
  } {
    // This is a simplified implementation
    // In a real application, this would use more sophisticated techniques
    // like machine learning or external content moderation APIs
    
    // Check for common problematic words/patterns
    const profanityPatterns = [
      /\b(fuck|shit|ass|bitch|cunt|damn|dick|asshole)\b/i,
      /\b(bastard|slut|whore|fag|faggot|nigger|retard)\b/i
    ];
    
    const violencePatterns = [
      /\b(kill|murder|torture|attack|beat|assault)\b.+\b(you|them|people|yourself)\b/i,
      /\b(gun|shoot|stab|weapon).+\b(school|public|people)\b/i
    ];
    
    const illegalActivityPatterns = [
      /\b(hack|steal|illegal|download|pirate).+\b(account|password|credit card|content)\b/i,
      /\b(buy|sell|purchase).+\b(drugs|cocaine|heroin|weed|pills)\b/i
    ];
    
    // Check each category
    for (const pattern of profanityPatterns) {
      if (pattern.test(text)) {
        return { detected: true, category: 'profane', confidence: 0.8 };
      }
    }
    
    for (const pattern of violencePatterns) {
      if (pattern.test(text)) {
        return { detected: true, category: 'violent', confidence: 0.9 };
      }
    }
    
    for (const pattern of illegalActivityPatterns) {
      if (pattern.test(text)) {
        return { detected: true, category: 'illegal', confidence: 0.85 };
      }
    }
    
    return { detected: false, confidence: 1.0 };
  }

  /**
   * Check if a link is safe
   * 
   * @param url URL to check
   * @returns Safety result
   */
  private checkLinkSafety(url: string): { 
    safe: boolean; 
    reason?: string; 
    confidence: number 
  } {
    // This is a simplified implementation
    // In a real application, this would use URL reputation services,
    // phishing databases, etc.
    
    // Check for common suspicious patterns
    const suspiciousPatterns = [
      /\.(tk|ml|ga|cf|gq|top)$/i, // Suspicious TLDs often used in abuse
      /^(bit\.ly|tinyurl\.com|goo\.gl)/, // URL shorteners (could be legitimate)
      /(login|signin|account|password|banking|paypal|ebay|amazon).*\.(info|biz|top)/i // Phishing attempts
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { 
          safe: false, 
          reason: 'Potentially suspicious URL pattern', 
          confidence: 0.7 
        };
      }
    }
    
    // Check for abnormal URL structure
    if (url.split('.').length > 3 || url.split('/').length > 7) {
      return { 
        safe: false, 
        reason: 'Unusual URL structure', 
        confidence: 0.6 
      };
    }
    
    return { safe: true, confidence: 0.9 };
  }
}
