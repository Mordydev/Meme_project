/**
 * Monitoring Middleware
 * 
 * Contains middleware functions for monitoring and metrics collection
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { performance } from 'perf_hooks';
import { incrementCounter, observeHistogram } from './metrics';

/**
 * Middleware to collect metrics about HTTP requests
 */
export function metricsMiddleware(request: FastifyRequest, reply: FastifyReply, done: () => void): void {
  // Start timing the request
  const start = performance.now();
  
  // Track active connections
  incrementCounter('http_active_connections');
  
  // Add response hook to record metrics when the response is sent
  reply.addHook('onSend', (request, reply, payload, done) => {
    // Calculate duration in seconds
    const duration = (performance.now() - start) / 1000;
    
    // Extract route pattern from request
    const route = request.routeOptions?.url || request.url;
    
    // Record request metrics
    incrementCounter('http_requests_total', {
      method: request.method,
      route,
      status_code: reply.statusCode.toString(),
    });
    
    observeHistogram('http_request_duration_seconds', duration, {
      method: request.method,
      route,
      status_code: reply.statusCode.toString(),
    });
    
    // Decrement active connections
    incrementCounter('http_active_connections', undefined, -1);
    
    // Log slow requests (over 1 second)
    if (duration > 1.0) {
      request.log.warn({
        msg: 'Slow request detected',
        duration,
        method: request.method,
        route,
        url: request.url
      });
    }
    
    done(null, payload);
  });
  
  done();
}

/**
 * Middleware to track database query metrics
 */
export function dbMetricsMiddleware(query: string, params: any[], startTime: number): void {
  const duration = (performance.now() - startTime) / 1000;
  
  // Determine query type and table
  const queryType = getQueryType(query);
  const table = getTableName(query);
  
  // Record query metrics
  incrementCounter('db_queries_total', {
    type: queryType,
    table,
  });
  
  observeHistogram('db_query_duration_seconds', duration, {
    type: queryType,
    table,
  });
  
  // Log slow queries (over 100ms)
  if (duration > 0.1) {
    console.warn({
      msg: 'Slow database query detected',
      duration,
      type: queryType,
      table,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
    });
  }
}

/**
 * Extract query type from SQL query
 */
function getQueryType(query: string): string {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (normalizedQuery.startsWith('SELECT')) return 'SELECT';
  if (normalizedQuery.startsWith('INSERT')) return 'INSERT';
  if (normalizedQuery.startsWith('UPDATE')) return 'UPDATE';
  if (normalizedQuery.startsWith('DELETE')) return 'DELETE';
  if (normalizedQuery.startsWith('CREATE')) return 'CREATE';
  if (normalizedQuery.startsWith('ALTER')) return 'ALTER';
  if (normalizedQuery.startsWith('DROP')) return 'DROP';
  
  return 'OTHER';
}

/**
 * Extract table name from SQL query
 */
function getTableName(query: string): string {
  // This is a simple implementation and may not work for all queries
  const normalizedQuery = query.trim().toUpperCase();
  let match: RegExpMatchArray | null = null;
  
  if (normalizedQuery.startsWith('SELECT')) {
    // Try to match "FROM table_name"
    match = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  } else if (normalizedQuery.startsWith('INSERT')) {
    // Try to match "INTO table_name"
    match = query.match(/INTO\s+([a-zA-Z0-9_]+)/i);
  } else if (normalizedQuery.startsWith('UPDATE')) {
    // Try to match "UPDATE table_name"
    match = query.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
  } else if (normalizedQuery.startsWith('DELETE')) {
    // Try to match "FROM table_name"
    match = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  } else if (normalizedQuery.startsWith('CREATE') || normalizedQuery.startsWith('ALTER') || normalizedQuery.startsWith('DROP')) {
    // Try to match "TABLE table_name"
    match = query.match(/TABLE\s+([a-zA-Z0-9_]+)/i);
  }
  
  return match ? match[1].toLowerCase() : 'unknown';
}
