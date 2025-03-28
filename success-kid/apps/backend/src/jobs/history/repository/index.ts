/**
 * Job History Repository
 * 
 * Handles storage and retrieval of job history data.
 */
import { redisClient } from '../../../lib/redis-client';
import { JobHistoryEntry, JobHistoryQuery, JobHistoryPage } from '../types';
import { logger } from '../../../lib/logger';

/**
 * Job history repository class
 */
export class JobHistoryRepository {
  private readonly historyKeyPrefix = 'sk:job_history:';
  private readonly historyIndexKey = 'sk:job_history:index';
  
  /**
   * Initialize the repository
   */
  async initialize(): Promise<void> {
    // No initialization needed for Redis-based implementation
    logger.debug('Job history repository initialized');
  }
  
  /**
   * Save a job history entry
   * 
   * @param entry Job history entry to save
   * @returns The saved entry
   */
  async saveEntry(entry: JobHistoryEntry): Promise<JobHistoryEntry> {
    try {
      const key = `${this.historyKeyPrefix}${entry.id}`;
      
      // Store entry as JSON
      await redisClient.set(key, JSON.stringify(entry));
      
      // Add to index
      await redisClient.client.zadd(
        this.historyIndexKey,
        entry.startedAt.getTime(),
        entry.id
      );
      
      logger.debug('Saved job history entry', { id: entry.id });
      
      return entry;
    } catch (error) {
      logger.error('Error saving job history entry', { error, entry });
      throw error;
    }
  }
  
  /**
   * Find a job history entry by ID
   * 
   * @param id Entry ID
   * @returns Job history entry or null if not found
   */
  async findById(id: string): Promise<JobHistoryEntry | null> {
    try {
      const key = `${this.historyKeyPrefix}${id}`;
      const data = await redisClient.get(key);
      
      if (!data) {
        return null;
      }
      
      const entry = JSON.parse(data) as JobHistoryEntry;
      
      // Convert string dates to Date objects
      entry.startedAt = new Date(entry.startedAt);
      if (entry.finishedAt) {
        entry.finishedAt = new Date(entry.finishedAt);
      }
      entry.createdAt = new Date(entry.createdAt);
      
      return entry;
    } catch (error) {
      logger.error('Error finding job history entry', { error, id });
      return null;
    }
  }
  
  /**
   * Find job history entries by queue and job ID
   * 
   * @param queue Queue name
   * @param jobId Job ID
   * @returns Array of job history entries
   */
  async findByQueueAndJobId(
    queue: string, 
    jobId: string
  ): Promise<JobHistoryEntry[]> {
    try {
      // Get all IDs from index
      const entryIds = await redisClient.client.zrange(this.historyIndexKey, 0, -1);
      
      // Fetch and filter entries
      const entries: JobHistoryEntry[] = [];
      
      for (const id of entryIds) {
        const entry = await this.findById(id);
        
        if (entry && entry.queue === queue && entry.jobId === jobId) {
          entries.push(entry);
        }
      }
      
      return entries;
    } catch (error) {
      logger.error('Error finding job history entries by queue and job ID', { 
        error, queue, jobId 
      });
      return [];
    }
  }
  
  /**
   * Find job history entries by query
   * 
   * @param query Search query
   * @returns Paginated results
   */
  async findByQuery(query: JobHistoryQuery): Promise<JobHistoryPage> {
    try {
      // Default pagination values
      const page = query.page || 1;
      const pageSize = query.pageSize || 20;
      
      // Convert query time ranges to timestamps for Redis
      const startTime = query.startTime ? query.startTime.getTime() : 0;
      const endTime = query.endTime ? query.endTime.getTime() : Infinity;
      
      // Get IDs from index, sorted by time
      const entryIds = await redisClient.client.zrangebyscore(
        this.historyIndexKey,
        startTime,
        endTime
      );
      
      // Apply sorting (Redis already sorts by time)
      let sortedIds = entryIds;
      if (query.sortBy && query.sortBy !== 'startedAt') {
        // For other sort fields, we need to fetch all entries and sort in memory
        // This is not efficient for large datasets but works for demo
        const entries = await Promise.all(
          entryIds.map(id => this.findById(id))
        );
        
        const filteredEntries = entries
          .filter(entry => entry !== null) as JobHistoryEntry[];
        
        // Sort entries
        filteredEntries.sort((a, b) => {
          const aValue = this.getSortValue(a, query.sortBy!);
          const bValue = this.getSortValue(b, query.sortBy!);
          
          return query.sortDirection === 'desc'
            ? bValue - aValue
            : aValue - bValue;
        });
        
        sortedIds = filteredEntries.map(entry => entry.id);
      } else if (query.sortDirection === 'desc') {
        // Reverse for descending order
        sortedIds = sortedIds.reverse();
      }
      
      // Apply additional filtering
      const filteredIds: string[] = [];
      
      for (const id of sortedIds) {
        const entry = await this.findById(id);
        
        if (!entry) {
          continue;
        }
        
        // Apply filters
        if (
          (query.queues && query.queues.length > 0 && !query.queues.includes(entry.queue)) ||
          (query.names && query.names.length > 0 && !query.names.includes(entry.name)) ||
          (query.status && query.status.length > 0 && !query.status.includes(entry.status)) ||
          (query.minProcessingTime !== undefined && 
            (entry.processingTime === undefined || entry.processingTime < query.minProcessingTime)) ||
          (query.maxProcessingTime !== undefined && 
            (entry.processingTime === undefined || entry.processingTime > query.maxProcessingTime))
        ) {
          continue;
        }
        
        filteredIds.push(id);
      }
      
      // Calculate pagination
      const totalCount = filteredIds.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Get paginated IDs
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedIds = filteredIds.slice(startIndex, endIndex);
      
      // Fetch entries for paginated IDs
      const entries = await Promise.all(
        paginatedIds.map(id => this.findById(id))
      );
      
      // Filter out null entries (should not happen but just in case)
      const validEntries = entries.filter(entry => entry !== null) as JobHistoryEntry[];
      
      return {
        entries: validEntries,
        totalCount,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      logger.error('Error finding job history entries by query', { error, query });
      
      // Return empty results on error
      return {
        entries: [],
        totalCount: 0,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalPages: 0
      };
    }
  }
  
  /**
   * Find job history entries by time range
   * 
   * @param startTime Start time
   * @param endTime End time
   * @param options Additional options
   * @returns Array of job history entries
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    options?: { queues?: string[]; names?: string[] }
  ): Promise<JobHistoryEntry[]> {
    try {
      // Convert times to timestamps for Redis
      const startTimestamp = startTime.getTime();
      const endTimestamp = endTime.getTime();
      
      // Get IDs from index
      const entryIds = await redisClient.client.zrangebyscore(
        this.historyIndexKey,
        startTimestamp,
        endTimestamp
      );
      
      // Fetch entries
      const entries: JobHistoryEntry[] = [];
      
      for (const id of entryIds) {
        const entry = await this.findById(id);
        
        if (!entry) {
          continue;
        }
        
        // Apply filters
        if (
          (options?.queues && options.queues.length > 0 && !options.queues.includes(entry.queue)) ||
          (options?.names && options.names.length > 0 && !options.names.includes(entry.name))
        ) {
          continue;
        }
        
        entries.push(entry);
      }
      
      return entries;
    } catch (error) {
      logger.error('Error finding job history entries by time range', { 
        error, startTime, endTime 
      });
      return [];
    }
  }
  
  /**
   * Delete an entry
   * 
   * @param id Entry ID
   * @returns true if deleted, false if not found
   */
  async deleteEntry(id: string): Promise<boolean> {
    try {
      const key = `${this.historyKeyPrefix}${id}`;
      
      // Check if entry exists
      const exists = await redisClient.exists(key);
      
      if (!exists) {
        return false;
      }
      
      // Delete entry
      await redisClient.del(key);
      
      // Remove from index
      await redisClient.client.zrem(this.historyIndexKey, id);
      
      logger.debug('Deleted job history entry', { id });
      
      return true;
    } catch (error) {
      logger.error('Error deleting job history entry', { error, id });
      return false;
    }
  }
  
  /**
   * Delete entries older than a certain time
   * 
   * @param maxAge Maximum age in milliseconds
   * @returns Number of entries deleted
   */
  async deleteOlderThan(maxAge: number): Promise<number> {
    try {
      const cutoffTime = Date.now() - maxAge;
      
      // Get IDs older than cutoff time
      const entryIds = await redisClient.client.zrangebyscore(
        this.historyIndexKey,
        0,
        cutoffTime
      );
      
      // Delete entries
      let deletedCount = 0;
      
      for (const id of entryIds) {
        const key = `${this.historyKeyPrefix}${id}`;
        await redisClient.del(key);
        deletedCount++;
      }
      
      // Remove from index
      if (entryIds.length > 0) {
        await redisClient.client.zremrangebyscore(
          this.historyIndexKey,
          0,
          cutoffTime
        );
      }
      
      logger.info('Deleted old job history entries', { 
        count: deletedCount, 
        maxAgeMs: maxAge 
      });
      
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting old job history entries', { error, maxAge });
      return 0;
    }
  }
  
  /**
   * Count entries matching a query
   * 
   * @param query Search query
   * @returns Number of matching entries
   */
  async countByQuery(query: JobHistoryQuery): Promise<number> {
    try {
      // This is not efficient for large datasets but works for demo
      // In a real implementation, we would use more efficient counting methods
      
      // Get total
      const result = await this.findByQuery({
        ...query,
        page: 1,
        pageSize: 1 // We only need count, not actual entries
      });
      
      return result.totalCount;
    } catch (error) {
      logger.error('Error counting job history entries', { error, query });
      return 0;
    }
  }
  
  /**
   * Get a sort value for an entry
   * 
   * @param entry Entry to get sort value from
   * @param sortBy Sort field
   * @returns Numeric value for sorting
   */
  private getSortValue(
    entry: JobHistoryEntry, 
    sortBy: string
  ): number {
    switch (sortBy) {
      case 'startedAt':
        return entry.startedAt.getTime();
      case 'finishedAt':
        return entry.finishedAt ? entry.finishedAt.getTime() : 0;
      case 'processingTime':
        return entry.processingTime || 0;
      case 'createdAt':
        return entry.createdAt.getTime();
      default:
        return 0;
    }
  }
}
