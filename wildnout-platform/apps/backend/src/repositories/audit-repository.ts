import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { SecurityEventType, AuditLog } from '../services/core/audit-service';

/**
 * Repository for handling audit log storage and retrieval
 */
export class AuditRepository extends BaseRepository {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'security_audit_log');
  }

  /**
   * Create a new audit log entry
   * 
   * @param auditData Audit log data to store
   * @returns The created audit log entry
   */
  async create(auditData: {
    eventType: SecurityEventType;
    userId: string | null;
    context: {
      ip: string;
      userAgent: string;
      sessionId?: string;
      requestId?: string;
      endpoint?: string;
      timestamp: Date;
    };
    details: any;
    severity: 'low' | 'medium' | 'high';
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
  }): Promise<AuditLog> {
    try {
      const { data, error } = await this.db
        .from(this.table)
        .insert(auditData)
        .select()
        .single();
      
      if (error) {
        this.logger.error({ error, data: auditData }, `Failed to create audit log in ${this.table}`);
        throw error;
      }
      
      // Map database record to AuditLog interface
      return {
        id: data.id,
        event: data.eventType as SecurityEventType,
        userId: data.userId,
        context: data.context,
        data: data.details,
        severity: data.severity,
        timestamp: new Date(data.timestamp)
      };
    } catch (error) {
      // Fallback to local logging if database insertion fails
      this.logger.error(
        { error, eventType: auditData.eventType, userId: auditData.userId }, 
        'Failed to store audit log, falling back to local logging'
      );
      
      // Create a local audit log object
      const fallbackLog: AuditLog = {
        id: crypto.randomUUID(),
        event: auditData.eventType,
        userId: auditData.userId,
        context: auditData.context,
        data: auditData.details,
        severity: auditData.severity,
        timestamp: auditData.timestamp
      };
      
      return fallbackLog;
    }
  }
  
  /**
   * Query audit logs with filtering
   * 
   * @param filters Filter criteria for audit logs
   * @param options Pagination and sorting options
   * @returns Filtered audit logs and total count
   */
  async query(
    filters: {
      event?: SecurityEventType;
      userId?: string;
      severity?: 'low' | 'medium' | 'high';
      startDate?: Date;
      endDate?: Date;
      ip?: string;
    },
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      let query = this.db.from(this.table).select('*', { count: 'exact' });
      
      // Apply filters
      if (filters.event) {
        query = query.eq('eventType', filters.event);
      }
      
      if (filters.userId) {
        query = query.eq('userId', filters.userId);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      
      if (filters.ip) {
        query = query.eq('ipAddress', filters.ip);
      }
      
      // Apply pagination and sorting
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const sortBy = options.sortBy || 'timestamp';
      const sortDir = options.sortDir || 'desc';
      
      query = query
        .order(sortBy, { ascending: sortDir === 'asc' })
        .range(offset, offset + limit - 1);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) {
        this.logger.error({ error, filters }, `Error querying ${this.table}`);
        throw error;
      }
      
      // Map database records to AuditLog interface
      const logs: AuditLog[] = data.map((record: any) => ({
        id: record.id,
        event: record.eventType as SecurityEventType,
        userId: record.userId,
        context: record.context,
        data: record.details,
        severity: record.severity,
        timestamp: new Date(record.timestamp)
      }));
      
      return {
        logs,
        total: count || 0
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to query audit logs');
      return { logs: [], total: 0 };
    }
  }
  
  /**
   * Get audit logs for a specific user
   * 
   * @param userId User ID to get logs for
   * @param limit Maximum number of logs to return
   * @returns User's audit logs
   */
  async getUserLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    try {
      const { logs } = await this.query(
        { userId },
        { limit, sortDir: 'desc' }
      );
      return logs;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get user audit logs');
      return [];
    }
  }
  
  /**
   * Get high severity audit logs for monitoring
   * 
   * @param days Number of days to look back
   * @param limit Maximum number of logs to return
   * @returns High severity audit logs
   */
  async getHighSeverityLogs(days = 7, limit = 100): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      const { logs } = await this.query(
        { 
          severity: 'high',
          startDate
        },
        { limit, sortDir: 'desc' }
      );
      return logs;
    } catch (error) {
      this.logger.error({ error, days }, 'Failed to get high severity audit logs');
      return [];
    }
  }
  
  /**
   * Delete old audit logs
   * 
   * @param olderThanDays Delete logs older than this many days
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(olderThanDays = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const { error, count } = await this.db
        .from(this.table)
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('count');
      
      if (error) {
        this.logger.error({ error, olderThanDays }, 'Failed to clean up old audit logs');
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      this.logger.error({ error, olderThanDays }, 'Failed to clean up old audit logs');
      return 0;
    }
  }
}
