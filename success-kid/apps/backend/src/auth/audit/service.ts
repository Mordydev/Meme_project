/**
 * Audit Logging Service
 * 
 * Handles security audit logging for authentication and authorization events
 */
import { db } from '../../lib/db';
import { logger } from '../../lib/logger';
import { 
  AuditEvent, 
  AuditEventType, 
  AuditSeverity,
  DEFAULT_SEVERITY_MAP
} from './events';
import { redis } from '../../lib/redis';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  event_type: string;
  user_id?: string;
  session_id?: string;
  organization_id?: string;
  ip_address?: string;
  user_agent?: string;
  severity: string;
  metadata?: Record<string, any>;
}

/**
 * Audit query parameters
 */
export interface AuditQuery {
  eventTypes?: AuditEventType[];
  userId?: string;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity;
  limit?: number;
  offset?: number;
}

/**
 * Default query limit
 */
const DEFAULT_QUERY_LIMIT = 100;

/**
 * Queue key for audit events
 */
const AUDIT_QUEUE_KEY = 'audit:queue';

/**
 * Audit Logging Service
 */
export class AuditService {
  /**
   * Log an audit event
   * 
   * @param event The audit event to log
   * @returns The created audit log entry ID
   */
  async logEvent(event: AuditEvent): Promise<string> {
    try {
      // Set default severity if not provided
      const severity = event.severity || DEFAULT_SEVERITY_MAP[event.type] || AuditSeverity.INFO;
      
      // Create audit log entry
      const entry: Omit<AuditLogEntry, 'id'> = {
        timestamp: new Date(),
        event_type: event.type,
        user_id: event.userId,
        session_id: event.sessionId,
        organization_id: event.organizationId,
        ip_address: event.ip,
        user_agent: event.userAgent,
        severity,
        metadata: event.metadata
      };
      
      // Queue event for batch processing
      // This improves performance by not blocking on database writes
      await redis.rpush(AUDIT_QUEUE_KEY, JSON.stringify(entry));
      
      // For high-severity events, process immediately
      if (severity === AuditSeverity.CRITICAL || severity === AuditSeverity.ERROR) {
        await this.processAuditQueue();
      }
      
      // Generate a temporary ID (in production, this would come from the database)
      return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    } catch (error) {
      // Never fail the application due to audit logging
      logger.error('Error logging audit event', { error, event });
      return '';
    }
  }
  
  /**
   * Process the audit log queue
   * Intended to be called by a background job
   */
  async processAuditQueue(batchSize: number = 100): Promise<number> {
    try {
      // Process audit events in batches
      let processedCount = 0;
      
      // Process up to batchSize entries
      for (let i = 0; i < batchSize; i++) {
        // Get event from queue
        const eventJson = await redis.lpop(AUDIT_QUEUE_KEY);
        
        if (!eventJson) {
          // No more events in queue
          break;
        }
        
        // Parse event
        const entry = JSON.parse(eventJson) as Omit<AuditLogEntry, 'id'>;
        
        // Insert into database
        await db.query(
          `INSERT INTO audit_logs
           (timestamp, event_type, user_id, session_id, organization_id, ip_address, user_agent, severity, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            entry.timestamp,
            entry.event_type,
            entry.user_id,
            entry.session_id,
            entry.organization_id,
            entry.ip_address,
            entry.user_agent,
            entry.severity,
            JSON.stringify(entry.metadata || {})
          ]
        );
        
        processedCount++;
      }
      
      return processedCount;
    } catch (error) {
      logger.error('Error processing audit queue', { error });
      return 0;
    }
  }
  
  /**
   * Get audit logs based on query parameters
   * 
   * @param query Query parameters
   * @returns Audit log entries matching the query
   */
  async getAuditLogs(query: AuditQuery = {}): Promise<AuditLogEntry[]> {
    try {
      // Build WHERE clauses
      const conditions: string[] = [];
      const parameters: any[] = [];
      
      // Add event type filter
      if (query.eventTypes && query.eventTypes.length > 0) {
        conditions.push(`event_type IN (${query.eventTypes.map((_, i) => `$${parameters.length + i + 1}`).join(', ')})`);
        parameters.push(...query.eventTypes);
      }
      
      // Add user ID filter
      if (query.userId) {
        conditions.push(`user_id = $${parameters.length + 1}`);
        parameters.push(query.userId);
      }
      
      // Add organization ID filter
      if (query.organizationId) {
        conditions.push(`organization_id = $${parameters.length + 1}`);
        parameters.push(query.organizationId);
      }
      
      // Add date range filters
      if (query.startDate) {
        conditions.push(`timestamp >= $${parameters.length + 1}`);
        parameters.push(query.startDate);
      }
      
      if (query.endDate) {
        conditions.push(`timestamp <= $${parameters.length + 1}`);
        parameters.push(query.endDate);
      }
      
      // Add severity filter
      if (query.severity) {
        conditions.push(`severity = $${parameters.length + 1}`);
        parameters.push(query.severity);
      }
      
      // Build WHERE clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Add pagination
      const limit = query.limit || DEFAULT_QUERY_LIMIT;
      const offset = query.offset || 0;
      
      parameters.push(limit, offset);
      
      // Execute query
      const result = await db.query<AuditLogEntry>(
        `SELECT * FROM audit_logs
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`,
        parameters
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error querying audit logs', { error, query });
      return [];
    }
  }
  
  /**
   * Get audit events for a specific user
   * 
   * @param userId User ID
   * @param limit Maximum number of events to return
   * @param offset Pagination offset
   * @returns Audit log entries for the user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = DEFAULT_QUERY_LIMIT,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      userId,
      limit,
      offset
    });
  }
  
  /**
   * Get security-related audit events
   * 
   * @param limit Maximum number of events to return
   * @param offset Pagination offset
   * @returns Security-related audit log entries
   */
  async getSecurityAuditLogs(
    limit: number = DEFAULT_QUERY_LIMIT,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const securityEventTypes = [
      AuditEventType.USER_LOGIN_FAILED,
      AuditEventType.USER_ACCOUNT_LOCKED,
      AuditEventType.PASSWORD_RESET_REQUESTED,
      AuditEventType.PASSWORD_RESET_COMPLETED,
      AuditEventType.USER_PASSWORD_CHANGED,
      AuditEventType.USER_EMAIL_CHANGED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.ADMIN_ACTION
    ];
    
    return this.getAuditLogs({
      eventTypes: securityEventTypes,
      limit,
      offset
    });
  }
  
  /**
   * Get high-severity audit events
   * 
   * @param limit Maximum number of events to return
   * @param offset Pagination offset
   * @returns High-severity audit log entries
   */
  async getHighSeverityAuditLogs(
    limit: number = DEFAULT_QUERY_LIMIT,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      severity: AuditSeverity.CRITICAL,
      limit,
      offset
    });
  }
  
  /**
   * Get all audit events for a session
   * 
   * @param sessionId Session ID
   * @returns Audit log entries for the session
   */
  async getSessionAuditLogs(sessionId: string): Promise<AuditLogEntry[]> {
    try {
      const result = await db.query<AuditLogEntry>(
        'SELECT * FROM audit_logs WHERE session_id = $1 ORDER BY timestamp ASC',
        [sessionId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting session audit logs', { error, sessionId });
      return [];
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();
