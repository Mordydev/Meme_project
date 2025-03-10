import { SupabaseClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';
import { PaginatedResult } from '../base-repository';
import { MetricsService } from '../../../services/core/metrics-service';

/**
 * Options for keyset pagination
 */
export interface KeysetPaginationOptions {
  /**
   * The cursor value to start from
   */
  cursor?: any;
  
  /**
   * The field to use for cursor-based pagination
   */
  cursorField?: string;
  
  /**
   * The sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * The number of items to return
   */
  limit?: number;
  
  /**
   * Whether to include the total count
   */
  withCount?: boolean;
}

/**
 * Options for query timing
 */
export interface QueryTimingOptions {
  /**
   * The name of the query for metrics
   */
  queryName: string;
  
  /**
   * The table being queried
   */
  tableName: string;
  
  /**
   * Whether this is a cached query
   */
  cached?: boolean;
}

/**
 * Find entities with optimized keyset pagination
 * @param db Supabase client
 * @param tableName Table name
 * @param filters Filter criteria
 * @param options Pagination options
 * @param metricsService Optional metrics service
 */
export async function findWithKeyset<T>(
  db: SupabaseClient,
  tableName: string,
  filters: any = {},
  options: KeysetPaginationOptions = {},
  metricsService?: MetricsService
): Promise<PaginatedResult<T>> {
  const { 
    cursor, 
    cursorField = 'id', 
    sortDirection = 'desc',
    limit = 20,
    withCount = false
  } = options;
  
  let timer: () => number | undefined;
  if (metricsService) {
    timer = metricsService.startTimer();
  }
  
  try {
    // Start building query
    let query = db.from(tableName).select(
      '*', 
      { count: withCount ? 'exact' : 'planned' }
    );
    
    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            // Handle operator objects like { gt: 5 }
            const operators = Object.entries(value);
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
        }
      });
    }
    
    // Apply cursor-based pagination if cursor provided
    if (cursor) {
      // For descending order, get records where cursor field is less than cursor
      // For ascending order, get records where cursor field is greater than cursor
      const operator = sortDirection === 'desc' ? 'lt' : 'gt';
      query = query[operator](cursorField, cursor);
    }
    
    // Apply ordering
    query = query.order(cursorField, { ascending: sortDirection === 'asc' });
    
    // Apply limit (plus one to check for more results)
    query = query.limit(limit + 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Check if there are more results
    const hasMore = data && data.length > limit;
    const results = hasMore ? data.slice(0, limit) : data || [];
    
    // Get next cursor from last item
    const nextCursor = results.length > 0 ? results[results.length - 1][cursorField] : undefined;
    
    // Track metrics if service provided
    if (metricsService && timer) {
      const duration = timer();
      metricsService.timing(`repository.${tableName}.query_time`, duration);
      metricsService.gauge(`repository.${tableName}.result_size`, results.length);
      
      if (hasMore) {
        metricsService.increment(`repository.${tableName}.pagination_continued`, 1);
      }
    }
    
    return {
      data: results as T[],
      hasMore,
      cursor: nextCursor,
      totalCount: count
    };
  } catch (error) {
    // Track error metrics
    if (metricsService) {
      metricsService.increment(`repository.${tableName}.query_error`, 1);
    }
    throw error;
  }
}

/**
 * Execute a query with timing and metrics
 * @param fastify Fastify instance
 * @param queryFn Query function to execute
 * @param options Query timing options
 */
export async function executeWithTiming<T>(
  fastify: FastifyInstance,
  queryFn: () => Promise<T>,
  options: QueryTimingOptions
): Promise<T> {
  const { queryName, tableName, cached } = options;
  const fullQueryName = cached ? `${queryName}.cached` : queryName;
  const metricsService = fastify.metrics as MetricsService;
  const logger = fastify.log;
  
  // Start timer
  const timer = metricsService.startTimer();
  
  try {
    // Execute query
    const result = await queryFn();
    
    // Record success and timing
    const duration = timer();
    metricsService.timing(`query.${tableName}.${fullQueryName}.time`, duration);
    metricsService.increment(`query.${tableName}.${fullQueryName}.success`, 1);
    
    // Log slow queries
    if (duration > 500) {
      logger.warn({
        queryName,
        tableName,
        duration,
        threshold: 500
      }, 'Slow query detected');
      
      metricsService.increment(`query.${tableName}.${fullQueryName}.slow`, 1);
    }
    
    return result;
  } catch (error) {
    // Record failure
    metricsService.increment(`query.${tableName}.${fullQueryName}.error`, 1);
    
    // Log error
    logger.error({
      error,
      queryName,
      tableName
    }, 'Query error');
    
    throw error;
  }
}

/**
 * Find a single entity with optimized approach and error handling
 * @param db Supabase client
 * @param tableName Table name
 * @param id Entity ID
 * @param metricsService Optional metrics service
 */
export async function findByIdOptimized<T>(
  db: SupabaseClient,
  tableName: string,
  id: string,
  metricsService?: MetricsService
): Promise<T | null> {
  let timer: () => number | undefined;
  if (metricsService) {
    timer = metricsService.startTimer();
  }
  
  try {
    // Execute query with index-optimized approach
    const { data, error } = await db
      .from(tableName)
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();
    
    if (error) {
      // If not found, return null
      if (error.code === 'PGRST116') {
        if (metricsService) {
          metricsService.increment(`repository.${tableName}.not_found`, 1);
        }
        return null;
      }
      
      throw error;
    }
    
    // Track metrics if service provided
    if (metricsService && timer) {
      const duration = timer();
      metricsService.timing(`repository.${tableName}.findById`, duration);
    }
    
    return data as T;
  } catch (error) {
    // Track error metrics
    if (metricsService) {
      metricsService.increment(`repository.${tableName}.findById.error`, 1);
    }
    throw error;
  }
}

/**
 * Bulk insert with optimized approach and error handling
 * @param db Supabase client
 * @param tableName Table name
 * @param entities Entities to insert
 * @param metricsService Optional metrics service
 */
export async function bulkInsert<T>(
  db: SupabaseClient,
  tableName: string,
  entities: Partial<T>[],
  metricsService?: MetricsService
): Promise<T[]> {
  if (entities.length === 0) {
    return [];
  }
  
  let timer: () => number | undefined;
  if (metricsService) {
    timer = metricsService.startTimer();
  }
  
  // Add timestamps to all entities
  const currentTime = new Date();
  const entitiesWithTimestamps = entities.map(entity => ({
    ...entity,
    createdAt: entity.createdAt || currentTime,
    updatedAt: entity.updatedAt || currentTime
  }));
  
  try {
    // Execute bulk insert with returning
    const { data, error } = await db
      .from(tableName)
      .insert(entitiesWithTimestamps)
      .select('*');
    
    if (error) {
      throw error;
    }
    
    // Track metrics if service provided
    if (metricsService && timer) {
      const duration = timer();
      metricsService.timing(`repository.${tableName}.bulkInsert`, duration);
      metricsService.histogram(`repository.${tableName}.bulkInsert.count`, entities.length);
    }
    
    return data as T[];
  } catch (error) {
    // Track error metrics
    if (metricsService) {
      metricsService.increment(`repository.${tableName}.bulkInsert.error`, 1);
    }
    throw error;
  }
}

/**
 * Dynamic sort options builder for flexible sorting
 * @param sortField Field to sort by
 * @param sortDirection Sort direction
 */
export function buildSortOptions(
  sortField: string = 'createdAt',
  sortDirection: 'asc' | 'desc' = 'desc'
): { [key: string]: { ascending: boolean } } {
  return {
    [sortField]: { ascending: sortDirection === 'asc' }
  };
}

/**
 * Normalize filter object to handle special cases
 * @param filters Filter object
 */
export function normalizeFilters(filters: any = {}): any {
  const normalizedFilters: any = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    // Skip undefined values
    if (value === undefined) {
      return;
    }
    
    // Handle array values (convert to "in" operator)
    if (Array.isArray(value)) {
      normalizedFilters[key] = { in: value };
      return;
    }
    
    // Handle null values (convert to "is" operator)
    if (value === null) {
      normalizedFilters[key] = { is: null };
      return;
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      normalizedFilters[key] = value;
      return;
    }
    
    // Handle object values (already operator format)
    if (typeof value === 'object') {
      normalizedFilters[key] = value;
      return;
    }
    
    // Handle string values with wildcards (convert to "ilike" operator)
    if (typeof value === 'string' && (value.includes('*') || value.includes('%'))) {
      // Replace * with % for SQL LIKE pattern
      const pattern = value.replace(/\*/g, '%');
      normalizedFilters[key] = { ilike: pattern };
      return;
    }
    
    // Default: use equality
    normalizedFilters[key] = value;
  });
  
  return normalizedFilters;
}
