/**
 * Database Performance Testing Utility
 * 
 * Provides tools for benchmarking database queries, identifying performance bottlenecks,
 * and validating query optimization strategies.
 */
import { Pool } from 'pg';
import { getPool } from '../pool';
import { logger } from '../../lib/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Results of a query performance test
 */
interface QueryTestResult {
  name: string;
  query: string;
  duration: number;
  rowCount: number;
  planningTime: number;
  executionTime: number;
  indexesUsed: string[];
  bufferHitRatio: number;
  actualRows: number;
  actualLoops: number;
}

/**
 * Results for a test suite
 */
interface TestSuiteResult {
  name: string;
  timestamp: Date;
  totalDuration: number;
  queries: QueryTestResult[];
  failedQueries: { name: string; error: string }[];
}

/**
 * Performance test options
 */
interface PerformanceTestOptions {
  iterations?: number;
  warmUp?: boolean;
  outputPath?: string;
  logResults?: boolean;
  compareWithPrevious?: boolean;
}

/**
 * Database performance test utility
 */
export class DatabasePerformanceTester {
  private pool: Pool;
  private results: TestSuiteResult[] = [];
  
  /**
   * Create a performance tester
   * 
   * @param pool Optional database pool (uses default if not provided)
   */
  constructor(pool?: Pool) {
    this.pool = pool || getPool();
  }
  
  /**
   * Run a performance test on a set of queries
   * 
   * @param name Test suite name
   * @param queries Map of query names to query strings
   * @param options Test options
   * @returns Test results
   */
  async runTestSuite(
    name: string,
    queries: Record<string, string>,
    options: PerformanceTestOptions = {}
  ): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const testResult: TestSuiteResult = {
      name,
      timestamp: new Date(),
      totalDuration: 0,
      queries: [],
      failedQueries: []
    };
    
    const iterations = options.iterations || 3;
    
    logger.info(`Starting database performance test suite: ${name}`, {
      queries: Object.keys(queries),
      iterations
    });
    
    // Warm up the database if requested
    if (options.warmUp) {
      logger.debug('Warming up database connections');
      await this.warmUpPool();
    }
    
    // Run each query
    for (const [queryName, query] of Object.entries(queries)) {
      try {
        logger.debug(`Testing query: ${queryName}`);
        
        // Run multiple iterations and take average
        const results: QueryTestResult[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const result = await this.testQuery(queryName, query);
          results.push(result);
        }
        
        // Calculate average result
        const avgResult = this.calculateAverageResult(queryName, query, results);
        testResult.queries.push(avgResult);
        
        logger.debug(`Query test completed: ${queryName}`, {
          duration: avgResult.duration,
          rows: avgResult.rowCount
        });
      } catch (error) {
        logger.error(`Query test failed: ${queryName}`, { error });
        testResult.failedQueries.push({
          name: queryName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Calculate total duration
    testResult.totalDuration = Date.now() - startTime;
    
    // Save test results
    this.results.push(testResult);
    
    // Log results if requested
    if (options.logResults) {
      this.logTestResults(testResult);
    }
    
    // Save results to file if outputPath is provided
    if (options.outputPath) {
      this.saveResultsToFile(testResult, options.outputPath);
    }
    
    // Compare with previous results if requested
    if (options.compareWithPrevious && this.results.length > 1) {
      this.compareWithPreviousRun(testResult);
    }
    
    logger.info(`Performance test suite completed: ${name}`, {
      duration: testResult.totalDuration,
      queriesRun: testResult.queries.length,
      failedQueries: testResult.failedQueries.length
    });
    
    return testResult;
  }
  
  /**
   * Test a single query's performance
   * 
   * @param name Query name
   * @param query SQL query string
   * @returns Query test result
   */
  private async testQuery(name: string, query: string): Promise<QueryTestResult> {
    // Explain analyze the query
    const explainQuery = `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) ${query}`;
    const startTime = Date.now();
    const result = await this.pool.query(explainQuery);
    const duration = Date.now() - startTime;
    
    const plan = result.rows[0]['QUERY PLAN'][0];
    
    // Extract information from the execution plan
    const indexesUsed = this.extractIndexesUsed(plan);
    const bufferHits = this.extractBufferHits(plan);
    const bufferReads = this.extractBufferReads(plan);
    const bufferHitRatio = bufferReads > 0 
      ? bufferHits / (bufferHits + bufferReads) 
      : 1;
    
    // Run the actual query to get row count
    const actualResult = await this.pool.query(query);
    
    return {
      name,
      query,
      duration,
      rowCount: actualResult.rowCount,
      planningTime: plan['Planning Time'],
      executionTime: plan['Execution Time'],
      indexesUsed,
      bufferHitRatio,
      actualRows: plan['Plan']['Actual Rows'],
      actualLoops: plan['Plan']['Actual Loops']
    };
  }
  
  /**
   * Calculate the average result from multiple test iterations
   * 
   * @param name Query name
   * @param query SQL query string
   * @param results Array of test results
   * @returns Average test result
   */
  private calculateAverageResult(
    name: string,
    query: string,
    results: QueryTestResult[]
  ): QueryTestResult {
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const avgPlanningTime = results.reduce((sum, r) => sum + r.planningTime, 0) / results.length;
    const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    const avgBufferHitRatio = results.reduce((sum, r) => sum + r.bufferHitRatio, 0) / results.length;
    
    // Use the last result for non-numeric properties
    const lastResult = results[results.length - 1];
    
    return {
      name,
      query,
      duration: avgDuration,
      rowCount: lastResult.rowCount,
      planningTime: avgPlanningTime,
      executionTime: avgExecutionTime,
      indexesUsed: lastResult.indexesUsed,
      bufferHitRatio: avgBufferHitRatio,
      actualRows: lastResult.actualRows,
      actualLoops: lastResult.actualLoops
    };
  }
  
  /**
   * Extract indexes used from an execution plan
   * 
   * @param plan Execution plan
   * @returns Array of index names
   */
  private extractIndexesUsed(plan: any): string[] {
    const indexes: string[] = [];
    
    const extractFromNode = (node: any) => {
      if (node['Node Type']?.includes('Index') && node['Index Name']) {
        indexes.push(node['Index Name']);
      }
      
      // Recursively check child nodes
      if (node['Plans']) {
        for (const childPlan of node['Plans']) {
          extractFromNode(childPlan);
        }
      }
    };
    
    extractFromNode(plan['Plan']);
    return [...new Set(indexes)]; // Deduplicate
  }
  
  /**
   * Extract buffer hits from an execution plan
   * 
   * @param plan Execution plan
   * @returns Number of buffer hits
   */
  private extractBufferHits(plan: any): number {
    const extractFromNode = (node: any): number => {
      let hits = 0;
      
      if (node['Shared Hit Blocks']) {
        hits += node['Shared Hit Blocks'];
      }
      
      // Recursively check child nodes
      if (node['Plans']) {
        for (const childPlan of node['Plans']) {
          hits += extractFromNode(childPlan);
        }
      }
      
      return hits;
    };
    
    return extractFromNode(plan['Plan']);
  }
  
  /**
   * Extract buffer reads from an execution plan
   * 
   * @param plan Execution plan
   * @returns Number of buffer reads
   */
  private extractBufferReads(plan: any): number {
    const extractFromNode = (node: any): number => {
      let reads = 0;
      
      if (node['Shared Read Blocks']) {
        reads += node['Shared Read Blocks'];
      }
      
      // Recursively check child nodes
      if (node['Plans']) {
        for (const childPlan of node['Plans']) {
          reads += extractFromNode(childPlan);
        }
      }
      
      return reads;
    };
    
    return extractFromNode(plan['Plan']);
  }
  
  /**
   * Warm up the connection pool
   */
  private async warmUpPool(): Promise<void> {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(this.pool.query('SELECT 1'));
    }
    await Promise.all(promises);
  }
  
  /**
   * Log test results
   * 
   * @param result Test result
   */
  private logTestResults(result: TestSuiteResult): void {
    logger.info(`Test suite results: ${result.name}`, {
      totalDuration: result.totalDuration,
      queries: result.queries.length,
      failed: result.failedQueries.length
    });
    
    // Sort queries by duration (slowest first)
    const sortedQueries = [...result.queries].sort((a, b) => b.duration - a.duration);
    
    // Log top 5 slowest queries
    for (let i = 0; i < Math.min(5, sortedQueries.length); i++) {
      const query = sortedQueries[i];
      logger.info(`Slow query #${i + 1}: ${query.name}`, {
        duration: query.duration,
        executionTime: query.executionTime,
        planningTime: query.planningTime,
        rows: query.rowCount,
        indexesUsed: query.indexesUsed,
        bufferHitRatio: query.bufferHitRatio
      });
    }
    
    // Log failed queries
    for (const failure of result.failedQueries) {
      logger.error(`Failed query: ${failure.name}`, { error: failure.error });
    }
  }
  
  /**
   * Save test results to a file
   * 
   * @param result Test result
   * @param outputPath Output file path
   */
  private saveResultsToFile(result: TestSuiteResult, outputPath: string): void {
    try {
      const fileName = `perf_${result.name.replace(/\s+/g, '_')}_${new Date().toISOString().replace(/:/g, '-')}.json`;
      const filePath = path.resolve(outputPath, fileName);
      
      // Ensure directory exists
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write results to file
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
      logger.info(`Performance test results saved to ${filePath}`);
    } catch (error) {
      logger.error('Failed to save test results to file', { error });
    }
  }
  
  /**
   * Compare test results with previous run
   * 
   * @param currentResult Current test result
   */
  private compareWithPreviousRun(currentResult: TestSuiteResult): void {
    const previousResults = [...this.results];
    previousResults.pop(); // Remove current result
    
    if (previousResults.length === 0) {
      logger.info('No previous test results to compare with');
      return;
    }
    
    const previousResult = previousResults[previousResults.length - 1];
    logger.info(`Comparing with previous test run: ${previousResult.name}`, {
      previousTimestamp: previousResult.timestamp,
      previousDuration: previousResult.totalDuration
    });
    
    // Compare overall duration
    const durationDiff = currentResult.totalDuration - previousResult.totalDuration;
    const durationPct = (durationDiff / previousResult.totalDuration) * 100;
    
    logger.info(`Overall performance change: ${durationPct.toFixed(2)}%`, {
      currentDuration: currentResult.totalDuration,
      previousDuration: previousResult.totalDuration,
      difference: durationDiff
    });
    
    // Compare individual queries
    for (const currentQuery of currentResult.queries) {
      const previousQuery = previousResult.queries.find(q => q.name === currentQuery.name);
      
      if (previousQuery) {
        const queryDiff = currentQuery.duration - previousQuery.duration;
        const queryPct = (queryDiff / previousQuery.duration) * 100;
        
        if (Math.abs(queryPct) > 10) { // Only log significant changes (>10%)
          logger.info(`Query performance change: ${currentQuery.name}`, {
            change: `${queryPct.toFixed(2)}%`,
            currentDuration: currentQuery.duration,
            previousDuration: previousQuery.duration,
            indexChanges: this.compareArrays(previousQuery.indexesUsed, currentQuery.indexesUsed)
          });
        }
      }
    }
  }
  
  /**
   * Compare two arrays and return the differences
   * 
   * @param arrA First array
   * @param arrB Second array
   * @returns Object with added and removed items
   */
  private compareArrays<T>(arrA: T[], arrB: T[]): { added: T[], removed: T[] } {
    const added = arrB.filter(item => !arrA.includes(item));
    const removed = arrA.filter(item => !arrB.includes(item));
    return { added, removed };
  }
  
  /**
   * Generate a performance test report
   * 
   * @param result Test result
   * @returns HTML report string
   */
  generateHTMLReport(result: TestSuiteResult): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Performance Test Report - ${result.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .slow { background-color: #ffdddd; }
          .fast { background-color: #ddffdd; }
          .summary { margin-bottom: 20px; padding: 10px; background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Database Performance Test Report</h1>
        
        <div class="summary">
          <h2>Summary: ${result.name}</h2>
          <p><strong>Date:</strong> ${result.timestamp.toISOString()}</p>
          <p><strong>Total Duration:</strong> ${result.totalDuration}ms</p>
          <p><strong>Queries Tested:</strong> ${result.queries.length}</p>
          <p><strong>Failed Queries:</strong> ${result.failedQueries.length}</p>
        </div>
        
        <h2>Query Performance</h2>
        <table>
          <tr>
            <th>Query</th>
            <th>Duration (ms)</th>
            <th>Planning Time (ms)</th>
            <th>Execution Time (ms)</th>
            <th>Rows</th>
            <th>Indexes Used</th>
            <th>Buffer Hit Ratio</th>
          </tr>
          ${result.queries
            .sort((a, b) => b.duration - a.duration)
            .map(q => `
              <tr class="${q.duration > 500 ? 'slow' : q.duration < 100 ? 'fast' : ''}">
                <td>${q.name}</td>
                <td>${q.duration.toFixed(2)}</td>
                <td>${q.planningTime.toFixed(2)}</td>
                <td>${q.executionTime.toFixed(2)}</td>
                <td>${q.rowCount}</td>
                <td>${q.indexesUsed.join(', ') || 'None'}</td>
                <td>${(q.bufferHitRatio * 100).toFixed(2)}%</td>
              </tr>
            `).join('')}
        </table>
        
        ${result.failedQueries.length > 0 ? `
          <h2>Failed Queries</h2>
          <table>
            <tr>
              <th>Query</th>
              <th>Error</th>
            </tr>
            ${result.failedQueries.map(q => `
              <tr>
                <td>${q.name}</td>
                <td>${q.error}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        
        <h2>Query Details</h2>
        ${result.queries.map(q => `
          <div>
            <h3>${q.name}</h3>
            <pre>${q.query}</pre>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }
}

// Create a sample test suite for a migration runner
if (require.main === module) {
  (async () => {
    const tester = new DatabasePerformanceTester();
    
    // Define test queries based on common usage patterns
    const queries = {
      'user_find_by_id': 'SELECT * FROM users WHERE id = \'00000000-0000-0000-0000-000000000001\'',
      'user_find_by_email': 'SELECT * FROM users WHERE email = \'test@example.com\'',
      'content_recent': 'SELECT * FROM content WHERE status = \'active\' ORDER BY created_at DESC LIMIT 20',
      'content_with_author': `
        SELECT c.*, u.display_name as author_name
        FROM content c
        JOIN users u ON c.user_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT 20
      `,
      'user_points_total': `
        SELECT SUM(amount) as total_points
        FROM user_points
        WHERE user_id = '00000000-0000-0000-0000-000000000001'
      `,
      'leaderboard_points': `
        SELECT u.id, u.display_name, SUM(p.amount) as total_points
        FROM users u
        JOIN user_points p ON u.id = p.user_id
        WHERE u.status = 'active'
        GROUP BY u.id, u.display_name
        ORDER BY total_points DESC
        LIMIT 10
      `
    };
    
    // Run the test suite
    const results = await tester.runTestSuite('Core Queries', queries, {
      iterations: 3,
      warmUp: true,
      logResults: true,
      outputPath: path.resolve(__dirname, '../../../reports/performance')
    });
    
    // Generate and save HTML report
    const report = tester.generateHTMLReport(results);
    const reportPath = path.resolve(__dirname, '../../../reports/performance', 
      `perf_report_${new Date().toISOString().replace(/:/g, '-')}.html`);
      
    try {
      const directory = path.dirname(reportPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, report);
      console.log(`HTML report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save HTML report:', error);
    }
    
    process.exit(0);
  })();
}

export const databasePerfTester = new DatabasePerformanceTester();
