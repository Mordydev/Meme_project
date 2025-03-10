import { FastifyInstance } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError } from '../../lib/errors';
import {
  findWithKeyset,
  findByIdOptimized,
  bulkInsert,
  normalizeFilters,
  buildSortOptions,
  KeysetPaginationOptions
} from './utils/optimized-query-patterns';

/**
 * Pagination options for repository methods
 */
export interface PaginationOptions extends KeysetPaginationOptions {
  /**
   * @deprecated Use sortDirection instead
   */
  order?: 'asc' | 'desc';
}

/**
 * Pagination result with data and metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  cursor?: any;
  totalCount?: number;
}

/**
 * Filter options for repository methods
 */
export interface FilterOptions {
  [key: string]: any;
}

/**
 * Sort options for repository methods
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Base repository providing common data access patterns
 */
export abstract class BaseRepository<T> {
  protected readonly db: SupabaseClient;
  protected readonly tableName: string;
  protected readonly logger: any;

  constructor(
    protected readonly fastify: FastifyInstance,
    tableName: string
  ) {
    this.db = fastify.supabase;
    this.tableName = tableName;
    this.logger = fastify.log;
  }

  /**
   * Find an entity by ID with optimized approach
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await findByIdOptimized<T>(
        this.db,
        this.tableName,
        id,
        this.fastify.metrics
      );
    } catch (error) {
      this.logger.error(error, `Failed to get ${this.tableName} with ID ${id}`);
      throw new Error(`Failed to get ${this.tableName} with ID ${id}`);
    }
  }

  /**
   * Find entities matching filter criteria with optimized performance
   */
  async findMany(
    filter?: FilterOptions, 
    sort?: SortOptions
  ): Promise<T[]> {
    const metrics = this.fastify.metrics;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      // Normalize filters
      const normalizedFilters = normalizeFilters(filter);
      
      let query = this.db
        .from(this.tableName)
        .select('*');
      
      // Apply filters using normalized filter object
      if (normalizedFilters) {
        Object.entries(normalizedFilters).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle operator objects like { gt: 5 }
            const operators = Object.entries(value as any);
            operators.forEach(([op, val]) => {
              switch (op) {
                case 'eq':
                  query = query.eq(key, val);
                  break;
                case 'neq':
                  query = query.neq(key, val);
                  break;
                case 'gt':
                  query = query.gt(key, val);
                  break;
                case 'gte':
                  query = query.gte(key, val);
                  break;
                case 'lt':
                  query = query.lt(key, val);
                  break;
                case 'lte':
                  query = query.lte(key, val);
                  break;
                case 'in':
                  query = query.in(key, val as any[]);
                  break;
                case 'like':
                  query = query.like(key, val as string);
                  break;
                case 'ilike':
                  query = query.ilike(key, val as string);
                  break;
                case 'is':
                  query = query.is(key, val);
                  break;
                default:
                  query = query.eq(key, val);
              }
            });
          } else {
            // Simple equality
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply sorting - optimize with index-aware sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort by id to ensure consistent results
        query = query.order('id', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Log timing metrics
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.findMany`, duration);
        metrics.gauge(`repository.${this.tableName}.findMany.count`, data?.length || 0);
        
        // Log slow queries
        if (duration > 500) {
          this.logger.warn({
            tableName: this.tableName,
            filter,
            sort,
            duration,
          }, 'Slow repository query detected');
          
          metrics.increment(`repository.${this.tableName}.slow_query`, 1);
        }
      }
      
      return data as T[];
    } catch (error) {
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.findMany.error`, 1);
      }
      
      this.logger.error(error, `Failed to query ${this.tableName}`);
      throw new Error(`Failed to query ${this.tableName}`);
    }
  }

  /**
   * Find entities with pagination using keyset-based approach for optimal performance
   */
  async findManyWithPagination(
    filter?: FilterOptions,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    try {
      // Map legacy 'order' to 'sortDirection' if needed
      const paginationOptions: KeysetPaginationOptions = {
        ...options,
        sortDirection: options?.sortDirection || options?.order || 'desc'
      };
      
      // Normalize filters to support advanced filter operations
      const normalizedFilters = normalizeFilters(filter);
      
      return await findWithKeyset<T>(
        this.db,
        this.tableName,
        normalizedFilters,
        paginationOptions,
        this.fastify.metrics
      );
    } catch (error) {
      this.logger.error(error, `Failed to query ${this.tableName} with pagination`);
      throw new Error(`Failed to query ${this.tableName} with pagination`);
    }
  }

  /**
   * Create a new entity with optimized approach
   */
  async create(entity: Partial<T>): Promise<T> {
    const metrics = this.fastify.metrics;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      const currentTime = new Date();
      
      const dataWithTimestamps = {
        ...entity,
        createdAt: entity.createdAt || currentTime,
        updatedAt: entity.updatedAt || currentTime
      };
      
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(dataWithTimestamps)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Log timing metrics
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.create`, duration);
      }
      
      return data as T;
    } catch (error) {
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.create.error`, 1);
      }
      
      this.logger.error(error, `Failed to create ${this.tableName}`);
      throw new Error(`Failed to create ${this.tableName}`);
    }
  }
  
  /**
   * Create multiple entities in a batch operation
   */
  async createMany(entities: Partial<T>[]): Promise<T[]> {
    if (entities.length === 0) {
      return [];
    }
    
    try {
      return await bulkInsert<T>(
        this.db,
        this.tableName,
        entities,
        this.fastify.metrics
      );
    } catch (error) {
      this.logger.error(error, `Failed to bulk create ${this.tableName}`);
      throw new Error(`Failed to bulk create ${this.tableName}`);
    }
  }

  /**
   * Update an existing entity with optimized approach
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const metrics = this.fastify.metrics;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };
      
      const { data, error } = await this.db
        .from(this.tableName)
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        // If not found, throw specific error
        if (error.code === 'PGRST116') {
          if (metrics) {
            metrics.increment(`repository.${this.tableName}.update.not_found`, 1);
          }
          throw new NotFoundError(this.tableName, id);
        }
        
        throw error;
      }
      
      // Log timing metrics
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.update`, duration);
      }
      
      return data as T;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.update.error`, 1);
      }
      
      this.logger.error(error, `Failed to update ${this.tableName} with ID ${id}`);
      throw new Error(`Failed to update ${this.tableName} with ID ${id}`);
    }
  }

  /**
   * Delete an entity by ID with optimized approach
   */
  async delete(id: string): Promise<void> {
    const metrics = this.fastify.metrics;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      // First check if entity exists to avoid silent failures
      const exists = await this.findById(id);
      
      if (!exists) {
        if (metrics) {
          metrics.increment(`repository.${this.tableName}.delete.not_found`, 1);
        }
        throw new NotFoundError(this.tableName, id);
      }
      
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Log timing metrics
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.delete`, duration);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.delete.error`, 1);
      }
      
      this.logger.error(error, `Failed to delete ${this.tableName} with ID ${id}`);
      throw new Error(`Failed to delete ${this.tableName} with ID ${id}`);
    }
  }

  /**
   * Count entities matching the filter with optimized approach
   */
  async count(filter?: FilterOptions): Promise<number> {
    const metrics = this.fastify.metrics;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      // Normalize filters
      const normalizedFilters = normalizeFilters(filter);
      
      let query = this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });
      
      // Apply filters using normalized filter object
      if (normalizedFilters) {
        Object.entries(normalizedFilters).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle operator objects like { gt: 5 }
            const operators = Object.entries(value as any);
            operators.forEach(([op, val]) => {
              switch (op) {
                case 'eq':
                  query = query.eq(key, val);
                  break;
                case 'neq':
                  query = query.neq(key, val);
                  break;
                case 'gt':
                  query = query.gt(key, val);
                  break;
                case 'gte':
                  query = query.gte(key, val);
                  break;
                case 'lt':
                  query = query.lt(key, val);
                  break;
                case 'lte':
                  query = query.lte(key, val);
                  break;
                case 'in':
                  query = query.in(key, val as any[]);
                  break;
                case 'like':
                  query = query.like(key, val as string);
                  break;
                case 'ilike':
                  query = query.ilike(key, val as string);
                  break;
                case 'is':
                  query = query.is(key, val);
                  break;
                default:
                  query = query.eq(key, val);
              }
            });
          } else {
            // Simple equality
            query = query.eq(key, value);
          }
        });
      }
      
      const { count, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Log timing metrics
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.count`, duration);
      }
      
      return count || 0;
    } catch (error) {
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.count.error`, 1);
      }
      
      this.logger.error(error, `Failed to count ${this.tableName}`);
      throw new Error(`Failed to count ${this.tableName}`);
    }
  }

  /**
   * Execute a transaction with multiple operations
   */
  async transaction<R>(callback: (tx: SupabaseClient) => Promise<R>): Promise<R> {
    const metrics = this.fastify.metrics;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      // Execute transaction function with supabase client
      const result = await callback(this.db);
      
      // Log timing metrics
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.transaction`, duration);
        metrics.increment(`repository.${this.tableName}.transaction.success`, 1);
      }
      
      return result;
    } catch (error) {
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.transaction.error`, 1);
      }
      
      this.logger.error(error, 'Transaction failed');
      throw error;
    }
  }
  
  /**
   * Execute a query with timing and metrics
   */
  async executeWithTiming<R>(
    queryName: string,
    queryFn: () => Promise<R>,
    options?: { cached?: boolean }
  ): Promise<R> {
    const metrics = this.fastify.metrics;
    const fullQueryName = options?.cached ? `${queryName}.cached` : queryName;
    const timer = metrics ? metrics.startTimer() : null;
    
    try {
      // Execute query
      const result = await queryFn();
      
      // Record success and timing
      if (metrics && timer) {
        const duration = timer();
        metrics.timing(`repository.${this.tableName}.${fullQueryName}`, duration);
        metrics.increment(`repository.${this.tableName}.${fullQueryName}.success`, 1);
        
        // Log slow queries
        if (duration > 500) {
          this.logger.warn({
            queryName,
            tableName: this.tableName,
            duration,
            threshold: 500
          }, 'Slow repository query detected');
          
          metrics.increment(`repository.${this.tableName}.${fullQueryName}.slow`, 1);
        }
      }
      
      return result;
    } catch (error) {
      // Record failure
      if (metrics) {
        metrics.increment(`repository.${this.tableName}.${fullQueryName}.error`, 1);
      }
      
      // Log error
      this.logger.error({
        error,
        queryName,
        tableName: this.tableName
      }, 'Repository query error');
      
      throw error;
    }
  }
}
