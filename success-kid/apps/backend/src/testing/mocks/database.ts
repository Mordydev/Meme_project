/**
 * Mock Database Implementation
 * 
 * Provides an in-memory database for testing
 */
import { IDatabase } from '../../lib/db-client';

// In-memory database store
interface InMemoryStore {
  [table: string]: any[];
}

/**
 * Create a mock database for testing
 */
export function createMockDatabase(): IDatabase {
  // In-memory store
  const store: InMemoryStore = {};
  
  // Query log for inspection
  const queryLog: { query: string; params: any[]; timestamp: Date }[] = [];
  
  // Database connection mock
  const mockDatabase: IDatabase = {
    /**
     * Execute a query against the mock database
     */
    async query(query: string, params: any[] = []): Promise<any> {
      // Log the query
      queryLog.push({
        query,
        params,
        timestamp: new Date(),
      });
      
      // Check query type
      const normalizedQuery = query.trim().toUpperCase();
      
      if (normalizedQuery.startsWith('SELECT')) {
        return handleSelectQuery(query, params);
      } else if (normalizedQuery.startsWith('INSERT')) {
        return handleInsertQuery(query, params);
      } else if (normalizedQuery.startsWith('UPDATE')) {
        return handleUpdateQuery(query, params);
      } else if (normalizedQuery.startsWith('DELETE')) {
        return handleDeleteQuery(query, params);
      }
      
      // Default empty result
      return { rows: [] };
    },
    
    /**
     * Start a transaction (stub implementation)
     */
    async beginTransaction(): Promise<void> {
      // No-op for mock
      return Promise.resolve();
    },
    
    /**
     * Commit a transaction (stub implementation)
     */
    async commitTransaction(): Promise<void> {
      // No-op for mock
      return Promise.resolve();
    },
    
    /**
     * Rollback a transaction (stub implementation)
     */
    async rollbackTransaction(): Promise<void> {
      // No-op for mock
      return Promise.resolve();
    },
    
    /**
     * Get a table from the store, creating it if it doesn't exist
     */
    getTable(tableName: string): any[] {
      if (!store[tableName]) {
        store[tableName] = [];
      }
      return store[tableName];
    },
    
    /**
     * Reset the database to its initial state
     */
    reset(): void {
      Object.keys(store).forEach((key) => delete store[key]);
      queryLog.length = 0;
    },
    
    /**
     * Get the query log for inspection
     */
    getQueryLog(): typeof queryLog {
      return queryLog;
    },
  };
  
  /**
   * Handle a SELECT query
   */
  function handleSelectQuery(query: string, params: any[]): any {
    // This is a very simplified implementation
    // In a real mock, we would parse the query and filter appropriately
    
    // Extract table name from FROM clause (simplified)
    const tableMatch = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) {
      return { rows: [] };
    }
    
    const tableName = tableMatch[1];
    const table = mockDatabase.getTable(tableName);
    
    // Filter by WHERE clause if present (simplified)
    let filteredRows = [...table];
    const whereMatch = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
    
    if (whereMatch) {
      const whereClause = whereMatch[1];
      
      // Very simple WHERE handling
      // This only handles simple equality conditions
      filteredRows = table.filter((row) => {
        // Check each param against the row
        for (let i = 0; i < params.length; i++) {
          const paramValue = params[i];
          
          // Try to match the param to a field in the row
          const matches = Object.entries(row).some(([key, value]) => value === paramValue);
          
          if (!matches) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Handle LIMIT if present
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      filteredRows = filteredRows.slice(0, limit);
    }
    
    return { rows: filteredRows };
  }
  
  /**
   * Handle an INSERT query
   */
  function handleInsertQuery(query: string, params: any[]): any {
    // Extract table name
    const tableMatch = query.match(/INTO\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) {
      throw new Error('Table name not found in INSERT query');
    }
    
    const tableName = tableMatch[1];
    const table = mockDatabase.getTable(tableName);
    
    // Extract column names
    const columnsMatch = query.match(/\(([^)]+)\)/);
    if (!columnsMatch) {
      throw new Error('Column names not found in INSERT query');
    }
    
    const columns = columnsMatch[1].split(',').map((col) => col.trim());
    
    // Build row from params
    const row: Record<string, any> = {};
    for (let i = 0; i < columns.length; i++) {
      row[columns[i]] = params[i];
    }
    
    // Add to table
    table.push(row);
    
    // Return inserted row
    return { rows: [row] };
  }
  
  /**
   * Handle an UPDATE query
   */
  function handleUpdateQuery(query: string, params: any[]): any {
    // Extract table name
    const tableMatch = query.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) {
      throw new Error('Table name not found in UPDATE query');
    }
    
    const tableName = tableMatch[1];
    const table = mockDatabase.getTable(tableName);
    
    // Extract WHERE clause
    const whereMatch = query.match(/WHERE\s+(.*?)(?:RETURNING|$)/i);
    if (!whereMatch) {
      throw new Error('WHERE clause required for UPDATE queries in mock database');
    }
    
    // Extract SET clause
    const setMatch = query.match(/SET\s+(.*?)(?:WHERE|RETURNING|$)/i);
    if (!setMatch) {
      throw new Error('SET clause not found in UPDATE query');
    }
    
    // Very simple WHERE handling
    let updatedCount = 0;
    let updatedRows: any[] = [];
    
    // Update matching rows
    table.forEach((row, index) => {
      // Check if row matches WHERE condition
      let isMatch = true;
      
      // Very simplified WHERE condition matching
      for (let i = 0; i < params.length; i++) {
        const paramValue = params[i];
        
        // Try to match the param to a field in the row
        const matches = Object.values(row).some((value) => value === paramValue);
        
        if (!matches) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        // Update the row with new values
        // This is a very simplified implementation
        const updatedRow = { ...row };
        
        // Apply SET clause (simplified)
        const setClauseParams = params.slice(params.length / 2);
        const columnNames = Object.keys(row);
        
        for (let i = 0; i < setClauseParams.length; i++) {
          if (i < columnNames.length) {
            updatedRow[columnNames[i]] = setClauseParams[i];
          }
        }
        
        // Update the row
        table[index] = updatedRow;
        updatedCount++;
        updatedRows.push(updatedRow);
      }
    });
    
    return { rowCount: updatedCount, rows: updatedRows };
  }
  
  /**
   * Handle a DELETE query
   */
  function handleDeleteQuery(query: string, params: any[]): any {
    // Extract table name
    const tableMatch = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) {
      throw new Error('Table name not found in DELETE query');
    }
    
    const tableName = tableMatch[1];
    const table = mockDatabase.getTable(tableName);
    
    // Extract WHERE clause
    const whereMatch = query.match(/WHERE\s+(.*?)(?:RETURNING|$)/i);
    if (!whereMatch) {
      throw new Error('WHERE clause required for DELETE queries in mock database');
    }
    
    // Find indices to delete
    const indicesToDelete: number[] = [];
    
    table.forEach((row, index) => {
      // Check if row matches WHERE condition
      let isMatch = true;
      
      // Very simplified WHERE condition matching
      for (let i = 0; i < params.length; i++) {
        const paramValue = params[i];
        
        // Try to match the param to a field in the row
        const matches = Object.values(row).some((value) => value === paramValue);
        
        if (!matches) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        indicesToDelete.push(index);
      }
    });
    
    // Delete rows in reverse order to avoid shifting indices
    const deletedRows = indicesToDelete
      .sort((a, b) => b - a)
      .map((index) => {
        const row = table[index];
        table.splice(index, 1);
        return row;
      });
    
    return { rowCount: deletedRows.length, rows: deletedRows.reverse() };
  }
  
  return mockDatabase;
}
