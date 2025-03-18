/**
 * Database Indexing Strategy
 * 
 * Implements a comprehensive indexing strategy to ensure optimal query performance
 * under high load and with large data volumes.
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';

/**
 * Index definition for database tables
 */
export interface IndexDefinition {
  /** Name of the index */
  name: string;
  
  /** Table to create index on */
  table: string;
  
  /** Columns to include in the index */
  columns: string[];
  
  /** Whether index is unique */
  unique?: boolean;
  
  /** Index method (btree, hash, gin, etc.) */
  method?: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
  
  /** Optional WHERE clause for partial indexes */
  where?: string;
  
  /** Optional sort order for columns ('ASC' or 'DESC') */
  order?: { [column: string]: 'ASC' | 'DESC' };
  
  /** Whether this index is critical and should be created during initialization */
  critical?: boolean;
  
  /** Description/purpose of this index for documentation */
  description: string;
}

/**
 * Strategy for commonly used indexes to optimize the most critical queries
 */
export const indexStrategy: IndexDefinition[] = [
  // User-related indexes
  {
    name: 'idx_users_email',
    table: 'users',
    columns: ['email'],
    unique: true,
    critical: true,
    description: 'Unique index on email for fast user lookup and constraint enforcement'
  },
  {
    name: 'idx_users_display_name',
    table: 'users',
    columns: ['display_name'],
    description: 'Index for user search by display name'
  },
  {
    name: 'idx_users_created_at',
    table: 'users',
    columns: ['created_at'],
    description: 'Index for querying users by creation date'
  },
  {
    name: 'idx_users_status',
    table: 'users',
    columns: ['status'],
    description: 'Index for filtering users by status'
  },
  
  // Profile-related indexes
  {
    name: 'idx_profiles_user_id',
    table: 'profiles',
    columns: ['user_id'],
    unique: true,
    critical: true,
    description: 'Primary lookup for user profiles'
  },
  {
    name: 'idx_profiles_level',
    table: 'profiles',
    columns: ['level'],
    description: 'Index for leaderboard and level-based queries'
  },
  
  // Wallet connection indexes
  {
    name: 'idx_wallet_connections_user_id',
    table: 'wallet_connections',
    columns: ['user_id'],
    critical: true,
    description: 'Index for looking up wallet connections by user ID'
  },
  {
    name: 'idx_wallet_connections_wallet_address',
    table: 'wallet_connections',
    columns: ['wallet_address'],
    unique: true,
    critical: true,
    description: 'Unique index on wallet address to enforce 1:1 mapping'
  },
  {
    name: 'idx_wallet_connections_connected_at',
    table: 'wallet_connections',
    columns: ['connected_at'],
    description: 'Index for querying recent wallet connections'
  },
  
  // Content indexes
  {
    name: 'idx_content_user_id',
    table: 'content',
    columns: ['user_id'],
    critical: true,
    description: 'Index for looking up content by creator'
  },
  {
    name: 'idx_content_created_at',
    table: 'content',
    columns: ['created_at'],
    critical: true,
    description: 'Index for sorting content by creation time'
  },
  {
    name: 'idx_content_type',
    table: 'content',
    columns: ['type'],
    description: 'Index for filtering content by type'
  },
  {
    name: 'idx_content_status',
    table: 'content',
    columns: ['status'],
    description: 'Index for filtering content by status'
  },
  {
    name: 'idx_content_user_created',
    table: 'content',
    columns: ['user_id', 'created_at'],
    description: 'Composite index for user content feed sorted by date'
  },
  
  // Comments indexes
  {
    name: 'idx_comments_content_id',
    table: 'comments',
    columns: ['content_id'],
    critical: true,
    description: 'Index for looking up comments on content'
  },
  {
    name: 'idx_comments_user_id',
    table: 'comments',
    columns: ['user_id'],
    description: 'Index for looking up comments by a user'
  },
  {
    name: 'idx_comments_created_at',
    table: 'comments',
    columns: ['created_at'],
    description: 'Index for sorting comments by creation time'
  },
  {
    name: 'idx_comments_parent_id',
    table: 'comments',
    columns: ['parent_id'],
    description: 'Index for looking up replies to comments'
  },
  
  // User points indexes
  {
    name: 'idx_user_points_user_id',
    table: 'user_points',
    columns: ['user_id'],
    critical: true,
    description: 'Index for looking up point transactions by user'
  },
  {
    name: 'idx_user_points_created_at',
    table: 'user_points',
    columns: ['created_at'],
    description: 'Index for looking up point transactions by time'
  },
  {
    name: 'idx_user_points_source',
    table: 'user_points',
    columns: ['source'],
    description: 'Index for filtering points by source'
  },
  {
    name: 'idx_user_points_user_created',
    table: 'user_points',
    columns: ['user_id', 'created_at'],
    description: 'Composite index for user point history'
  },
  
  // Achievements indexes
  {
    name: 'idx_achievements_difficulty',
    table: 'achievements',
    columns: ['difficulty'],
    description: 'Index for filtering achievements by difficulty'
  },
  
  // User achievements indexes
  {
    name: 'idx_user_achievements_user_id',
    table: 'user_achievements',
    columns: ['user_id'],
    critical: true,
    description: 'Index for looking up achievements by user'
  },
  {
    name: 'idx_user_achievements_achievement_id',
    table: 'user_achievements',
    columns: ['achievement_id'],
    description: 'Index for looking up users with a specific achievement'
  },
  {
    name: 'idx_user_achievements_unlocked_at',
    table: 'user_achievements',
    columns: ['unlocked_at'],
    description: 'Index for sorting achievements by unlock time'
  },
  
  // Social connections (follows)
  {
    name: 'idx_user_follows_follower_id',
    table: 'user_follows',
    columns: ['follower_id'],
    critical: true,
    description: 'Index for looking up users followed by a specific user'
  },
  {
    name: 'idx_user_follows_following_id',
    table: 'user_follows',
    columns: ['following_id'],
    description: 'Index for looking up followers of a specific user'
  },
  {
    name: 'idx_user_follows_follower_following',
    table: 'user_follows',
    columns: ['follower_id', 'following_id'],
    unique: true,
    critical: true,
    description: 'Composite unique index to enforce unique follow relationships'
  }
];

/**
 * Creates indexes defined in the strategy
 * 
 * @param pool Database connection pool
 * @param criticalOnly Only create indexes marked as critical
 * @returns Promise that resolves when indexes are created
 */
export async function createIndexes(pool: Pool, criticalOnly: boolean = false): Promise<void> {
  logger.info('Creating database indexes', { criticalOnly });
  
  // Filter indexes if creating only critical ones
  const indexesToCreate = criticalOnly
    ? indexStrategy.filter(idx => idx.critical)
    : indexStrategy;
    
  // Create each index
  for (const index of indexesToCreate) {
    try {
      // Build column definition including optional order
      const columnDefs = index.columns.map(col => {
        if (index.order && index.order[col]) {
          return `${col} ${index.order[col]}`;
        }
        return col;
      });
      
      // Build complete SQL statement
      const method = index.method ? `USING ${index.method}` : '';
      const uniqueFlag = index.unique ? 'UNIQUE' : '';
      const whereClause = index.where ? `WHERE ${index.where}` : '';
      
      const sql = `
        CREATE ${uniqueFlag} INDEX IF NOT EXISTS ${index.name}
        ON ${index.table} ${method} (${columnDefs.join(', ')})
        ${whereClause}
      `;
      
      // Execute index creation
      await pool.query(sql);
      logger.info(`Created index ${index.name} on ${index.table}`);
    } catch (error) {
      logger.error(`Failed to create index ${index.name}`, {
        error: error instanceof Error ? error.message : String(error),
        table: index.table,
        columns: index.columns
      });
      
      // Don't throw error so other indexes can still be created
    }
  }
  
  logger.info('Database indexes creation completed');
}

/**
 * Validate if all critical indexes exist in the database
 * 
 * @param pool Database connection pool
 * @returns Promise that resolves to array of missing critical indexes
 */
export async function validateCriticalIndexes(pool: Pool): Promise<string[]> {
  // Get critical indexes
  const criticalIndexes = indexStrategy.filter(idx => idx.critical);
  const missingIndexes: string[] = [];
  
  // Check each critical index
  for (const index of criticalIndexes) {
    try {
      // Check if index exists
      const result = await pool.query(`
        SELECT 1 FROM pg_indexes 
        WHERE indexname = $1
      `, [index.name]);
      
      // If index doesn't exist, add to missing list
      if (result.rowCount === 0) {
        missingIndexes.push(index.name);
      }
    } catch (error) {
      logger.error(`Failed to check index ${index.name}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Assume index is missing if we couldn't check
      missingIndexes.push(index.name);
    }
  }
  
  return missingIndexes;
}

/**
 * Get detailed information about all current indexes
 * 
 * @param pool Database connection pool
 * @returns Promise that resolves to array of index information
 */
export async function getIndexInfo(pool: Pool): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT
        i.relname AS index_name,
        t.relname AS table_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique,
        am.amname AS index_method,
        pg_relation_size(i.oid) AS index_size,
        pg_size_pretty(pg_relation_size(i.oid)) AS index_size_pretty,
        s.idx_scan AS index_usage_count
      FROM
        pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_am am ON am.oid = i.relam
        JOIN pg_attribute a ON 
          a.attrelid = t.oid AND 
          a.attnum = ANY(ix.indkey)
        LEFT JOIN pg_stat_user_indexes s ON 
          s.indexrelid = i.oid
      WHERE
        t.relkind = 'r' AND
        i.relkind = 'i' AND
        i.relname NOT LIKE 'pg_%'
      ORDER BY
        t.relname, i.relname, a.attnum
    `);
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to get index information', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return [];
  }
}

/**
 * Analyze database tables to update statistics for the query planner
 * 
 * @param pool Database connection pool
 * @param tables Optional array of specific tables to analyze, or all tables if not provided
 * @returns Promise that resolves when analysis is complete
 */
export async function analyzeTables(pool: Pool, tables?: string[]): Promise<void> {
  try {
    if (tables && tables.length > 0) {
      // Analyze specific tables
      for (const table of tables) {
        await pool.query(`ANALYZE ${table}`);
        logger.info(`Analyzed table ${table}`);
      }
    } else {
      // Analyze all tables
      await pool.query('ANALYZE');
      logger.info('Analyzed all database tables');
    }
  } catch (error) {
    logger.error('Failed to analyze tables', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export default {
  indexStrategy,
  createIndexes,
  validateCriticalIndexes,
  getIndexInfo,
  analyzeTables
};
