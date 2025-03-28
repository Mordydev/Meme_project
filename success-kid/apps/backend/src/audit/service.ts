import { v4 as uuidv4 } from 'uuid';
import { FastifyRequest } from 'fastify';
import { AuditLogEntry, AuditEventData, AuditQuery, AuditAction, AuditResource } from './types';
import { logger } from '../lib/logger';

/**
 * Audit logging service for security events
 */
export class AuditService {
  // In-memory storage for audit logs (would be replaced with database in production)
  private logs: AuditLogEntry[] = [];
  
  /**
   * Log a security event
   */
  async logEvent(event: AuditEventData): Promise<AuditLogEntry> {
    try {
      const logEntry: AuditLogEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        ip: event.ip,
        userAgent: event.userAgent || 'Unknown',
        status: event.status,
        metadata: event.metadata
      };
      
      // In a real implementation, store in database
      this.logs.push(logEntry);
      
      // Log to application logs for security events
      logger.info('Security audit event', {
        event: {
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          status: event.status,
          ip: event.ip
        }
      });
      
      return logEntry;
    } catch (error) {
      logger.error('Failed to log audit event', { error, event });
      
      // Return a basic log entry even if storage fails
      return {
        id: uuidv4(),
        timestamp: new Date(),
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        ip: event.ip,
        userAgent: event.userAgent || 'Unknown',
        status: event.status,
        metadata: { error: 'Failed to store audit log' }
      };
    }
  }
  
  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(query: AuditQuery): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      // In a real implementation, query database with filters
      let filteredLogs = [...this.logs];
      
      // Apply filters
      if (query.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
      }
      
      if (query.action) {
        filteredLogs = filteredLogs.filter(log => log.action === query.action);
      }
      
      if (query.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === query.resource);
      }
      
      if (query.resourceId) {
        filteredLogs = filteredLogs.filter(log => log.resourceId === query.resourceId);
      }
      
      if (query.status) {
        filteredLogs = filteredLogs.filter(log => log.status === query.status);
      }
      
      if (query.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= query.startDate);
      }
      
      if (query.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= query.endDate);
      }
      
      // Sort by timestamp descending
      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply pagination
      const total = filteredLogs.length;
      const limit = query.limit || 10;
      const offset = query.offset || 0;
      
      return {
        logs: filteredLogs.slice(offset, offset + limit),
        total
      };
    } catch (error) {
      logger.error('Error getting audit logs', { error, query });
      return { logs: [], total: 0 };
    }
  }
  
  /**
   * Get a specific audit log by ID
   */
  async getAuditLog(id: string): Promise<AuditLogEntry | null> {
    try {
      // In a real implementation, query database by ID
      return this.logs.find(log => log.id === id) || null;
    } catch (error) {
      logger.error('Error getting audit log', { error, id });
      return null;
    }
  }
  
  /**
   * Create an audit log entry from a request
   */
  async logFromRequest(
    request: FastifyRequest,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    status: 'success' | 'failure' = 'success',
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    return this.logEvent({
      userId: request.user?.id,
      action,
      resource,
      resourceId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      status,
      metadata
    });
  }
  
  /**
   * Log authentication events
   */
  async logAuth(
    request: FastifyRequest,
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.TOKEN_REFRESH,
    status: 'success' | 'failure' = 'success',
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    return this.logFromRequest(
      request,
      action,
      AuditResource.AUTHENTICATION,
      undefined,
      status,
      metadata
    );
  }
  
  /**
   * Log user events
   */
  async logUserEvent(
    request: FastifyRequest,
    action: AuditAction,
    userId: string,
    status: 'success' | 'failure' = 'success',
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    return this.logFromRequest(
      request,
      action,
      AuditResource.USER,
      userId,
      status,
      metadata
    );
  }
  
  /**
   * Log failed authentication attempts
   */
  async logFailedAuth(
    request: FastifyRequest,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    return this.logAuth(
      request,
      AuditAction.LOGIN,
      'failure',
      { ...metadata, reason }
    );
  }
}

// Export singleton instance
export const auditService = new AuditService();
