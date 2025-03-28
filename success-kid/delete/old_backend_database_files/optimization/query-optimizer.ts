/**
 * Query Optimizer
 * 
 * Utilities for optimizing and analyzing database queries for performance.
 */
import { Pool, QueryResult } from 'pg';
import { logger } from '../../lib/logger';

/**
 * Query execution plan with timing information
 */
export interface QueryPlan {
  /** SQL query that was analyzed */
  query: string;
  
  /** Parsed execution plan */
  plan: any;
  
  /** Execution time in milliseconds */
  executionTime?: number;
  
  /** Planning time in milliseconds */
  planningTime?: number;
}

/**
 * Get the execution plan for a query without executing it
 * 
 * @param pool Database connection pool
 * @param query SQL query to analyze
 * @param params Query parameters
 * @returns Promise that resolves to the query execution plan
 */
export async function explainQuery(
  pool: Pool, 
  query: string, 
  params: any[] = []
): Promise<QueryPlan> {
  try {
    // Prefix the query with EXPLAIN
    const explainQuery = `EXPLAIN (FORMAT JSON) ${query}`;
    
    // Execute the EXPLAIN query
    const result = await pool.query(explainQuery, params);
    
    // Extract and return the plan
    return {
      query,
      plan: result.rows[0]['QUERY PLAN'][0]
    };
  } catch (error) {
    logger.error('Failed to explain query', {
      error: error instanceof Error ? error.message : String(error),
      query
    });
    
    throw error;
  }
}

/**
 * Get the execution plan and timing information for a query by actually executing it
 * 
 * @param pool Database connection pool
 * @param query SQL query to analyze
 * @param params Query parameters
 * @returns Promise that resolves to the query execution plan with timing
 */
export async function analyzeQuery(
  pool: Pool, 
  query: string, 
  params: any[] = []
): Promise<QueryPlan> {
  try {
    // Prefix the query with EXPLAIN ANALYZE
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    
    // Execute the EXPLAIN ANALYZE query
    const result = await pool.query(explainQuery, params);
    
    // Extract plan details
    const plan = result.rows[0]['QUERY PLAN'][0];
    
    return {
      query,
      plan,
      executionTime: plan.Execution_Time, 
      planningTime: plan.Planning_Time
    };
  } catch (error) {
    logger.error('Failed to analyze query', {
      error: error instanceof Error ? error.message : String(error),
      query
    });
    
    throw error;
  }
}

/**
 * Check a query for potential performance issues
 * 
 * @param plan Query execution plan
 * @returns Array of potential performance issues
 */
export function identifyQueryIssues(plan: QueryPlan): string[] {
  const issues: string[] = [];
  
  // Skip if no plan available
  if (!plan || !plan.plan) {
    return ['No execution plan available'];
  }
  
  // Check for sequential scans on large tables
  if (containsNode(plan.plan, 'Seq Scan') && !query.includes('LIMIT 1')) {
    issues.push('Sequential scan detected - consider adding an index');
  }
  
  // Check for hash joins on large tables
  if (containsNode(plan.plan, 'Hash Join')) {
    issues.push('Hash join detected - verify join conditions have appropriate indexes');
  }
  
  // Check for sorts in execution plan (indicates missing index for ORDER BY)
  if (containsNode(plan.plan, 'Sort')) {
    issues.push('Sort operation detected - consider adding an index to avoid sorting');
  }
  
  // Check for high planning or execution time
  if (plan.executionTime && plan.executionTime > 100) {
    issues.push(`High execution time (${Math.round(plan.executionTime)}ms) - query may need optimization`);
  }
  
  // Check for cartesian product (missing join condition)
  if (containsNode(plan.plan, 'Nested Loop') && plan.query.toLowerCase().includes('join')) {
    issues.push('Potential cartesian product detected - verify join conditions');
  }
  
  return issues;
}

/**
 * Check if an execution plan contains a specific node type
 * 
 * @param plan Execution plan or node
 * @param nodeType Type of node to search for
 * @returns True if the node type exists in the plan
 */
function containsNode(plan: any, nodeType: string): boolean {
  // Check if the current node matches
  if (plan['Node Type'] === nodeType) {
    return true;
  }
  
  // Check plans array (for nodes with child plans)
  if (plan.Plans && Array.isArray(plan.Plans)) {
    for (const childPlan of plan.Plans) {
      if (containsNode(childPlan, nodeType)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Log slow queries to help identify optimization opportunities
 * 
 * @param pool Database connection pool
 * @param query SQL query
 * @param params Query parameters
 * @param threshold Threshold in milliseconds to log slow queries
 * @returns Result of the query
 */
export async function monitorQuery<T>(
  pool: Pool, 
  query: string, 
  params: any[] = [], 
  threshold: number = 200
): Promise<QueryResult<T>> {
  const start = Date.now();
  
  try {
    // Execute the query
    const result = await pool.query<T>(query, params);
    
    // Calculate execution time
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > threshold) {
      logger.warn('Slow query detected', {
        duration,
        query,
        params,
        rowCount: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    // Still log execution time for failed queries
    const duration = Date.now() - start;
    
    logger.error('Query error', {
      duration,
      error: error instanceof Error ? error.message : String(error),
      query,
      params
    });
    
    throw error;
  }
}

/**
 * Generate optimized SQL for paginated queries using keyset pagination
 * 
 * @param table Table to query
 * @param orderColumn Column to order by
 * @param orderDirection Direction to order by (ASC or DESC)
 * @param whereClause Additional WHERE conditions
 * @param lastValue Last value for pagination (e.g., last ID)
 * @param limit Maximum number of records to return
 * @returns Optimized SQL query string
 */
export function buildKeysetPaginationQuery(
  table: string,
  orderColumn: string,
  orderDirection: 'ASC' | 'DESC' = 'DESC',
  whereClause: string = '',
  lastValue?: any,
  limit: number = 20
): string {
  // Base WHERE clause
  const baseWhere = whereClause ? `WHERE ${whereClause}` : '';
  
  // Pagination WHERE clause
  let paginationWhere = '';
  if (lastValue !== undefined) {
    const operator = orderDirection === 'DESC' ? '<' : '>';
    paginationWhere = whereClause
      ? ` AND ${orderColumn} ${operator} '${lastValue}'`
      : `WHERE ${orderColumn} ${operator} '${lastValue}'`;
  }
  
  // Construct the full query
  return `
    SELECT * FROM ${table}
    ${baseWhere}${paginationWhere}
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT ${limit}
  `;
}

/**
 * Build a parameterized query with named parameters
 * This helps with query reuse and prepared statement optimization
 * 
 * @param sql SQL query with named parameters like :paramName
 * @param params Object with parameter values
 * @returns Object with transformed SQL and params array
 */
export function buildParameterizedQuery(
  sql: string,
  params: Record<string, any>
): { sql: string; params: any[] } {
  const paramRegex = /:([\w]+)/g;
  const paramNames: string[] = [];
  const paramValues: any[] = [];
  
  // Replace named parameters with positional parameters
  const transformedSql = sql.replace(paramRegex, (match, paramName) => {
    paramNames.push(paramName);
    paramValues.push(params[paramName]);
    return `$${paramNames.length}`;
  });
  
  return {
    sql: transformedSql,
    params: paramValues
  };
}

export default {
  explainQuery,
  analyzeQuery,
  identifyQueryIssues,
  monitorQuery,
  buildKeysetPaginationQuery,
  buildParameterizedQuery
};
