'use client';

// Mock Supabase client for development until the real Supabase instance is set up
// This allows us to develop the auth and database features without an actual backend

// Define types similar to Supabase
import { PostgrestError } from '@supabase/supabase-js';

type SupabaseSelectResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type SupabaseInsertUpdateResponse = {
  error: PostgrestError | null;
};

// Simple in-memory database
const inMemoryDB = {
  profiles: [] as any[],
  scores: [] as any[],
};

// Mock data operations with localStorage for persistence
const saveToStorage = () => {
  try {
    localStorage.setItem('nemo_mock_db', JSON.stringify(inMemoryDB));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem('nemo_mock_db');
    if (data) {
      Object.assign(inMemoryDB, JSON.parse(data));
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }
};

// Initialize storage
loadFromStorage();

// Mock Supabase client
export const supabase = {
  from: (table: string) => {
    // Ensure table exists
    if (!inMemoryDB[table]) {
      inMemoryDB[table] = [];
    }
    
    let query = {
      _filters: [] as Array<{field: string; value: any; operator: string}>,
      _order: {field: null as string | null, ascending: true},
      _limit: null as number | null,
      _offset: 0,
      
      // Select operation
      select: (columns?: string) => {
        return query;
      },
      
      // Filter operations
      eq: (field: string, value: any) => {
        query._filters.push({field, value, operator: 'eq'});
        return query;
      },
      
      gt: (field: string, value: any) => {
        query._filters.push({field, value, operator: 'gt'});
        return query;
      },
      
      lt: (field: string, value: any) => {
        query._filters.push({field, value, operator: 'lt'});
        return query;
      },
      
      gte: (field: string, value: any) => {
        query._filters.push({field, value, operator: 'gte'});
        return query;
      },
      
      // Ordering
      order: (field: string, { ascending = true } = {}) => {
        query._order = { field, ascending };
        return query;
      },
      
      // Pagination
      limit: (limit: number) => {
        query._limit = limit;
        return query;
      },
      
      offset: (offset: number) => {
        query._offset = offset;
        return query;
      },
      
      // Range for pagination
      range: (start: number, end: number) => {
        query._offset = start;
        query._limit = end - start + 1;
        return query;
      },
      
      // Execute query
      async single<T>(): Promise<SupabaseSelectResponse<T>> {
        try {
          let results = [...inMemoryDB[table]];
          
          // Apply filters
          for (const filter of query._filters) {
            results = results.filter(item => {
              switch (filter.operator) {
                case 'eq':
                  return item[filter.field] === filter.value;
                case 'gt':
                  return item[filter.field] > filter.value;
                case 'lt':
                  return item[filter.field] < filter.value;
                case 'gte':
                  return item[filter.field] >= filter.value;
                default:
                  return true;
              }
            });
          }
          
          // Return the first item or null
          const result = results.length > 0 ? results[0] : null;
          return { data: result as T, error: null };
        } catch (error) {
          return { data: null, error: error as unknown as PostgrestError };
        }
      },
      
      async then<T>(): Promise<SupabaseSelectResponse<T[]>> {
        try {
          let results = [...inMemoryDB[table]];
          
          // Apply filters
          for (const filter of query._filters) {
            results = results.filter(item => {
              switch (filter.operator) {
                case 'eq':
                  return item[filter.field] === filter.value;
                case 'gt':
                  return item[filter.field] > filter.value;
                case 'lt':
                  return item[filter.field] < filter.value;
                case 'gte':
                  return item[filter.field] >= filter.value;
                default:
                  return true;
              }
            });
          }
          
          // Apply ordering
          if (query._order.field) {
            results.sort((a, b) => {
              const aVal = a[query._order.field as string];
              const bVal = b[query._order.field as string];
              
              if (aVal < bVal) return query._order.ascending ? -1 : 1;
              if (aVal > bVal) return query._order.ascending ? 1 : -1;
              return 0;
            });
          }
          
          // Apply pagination
          if (query._limit !== null) {
            results = results.slice(query._offset, query._offset + query._limit);
          }
          
          return { data: results as T[], error: null };
        } catch (error) {
          return { data: null, error: error as unknown as PostgrestError };
        }
      },
      
      // Insert operation
      async insert(data: any): Promise<SupabaseInsertUpdateResponse> {
        try {
          // Add timestamp if not provided
          if (!data.created_at) {
            data.created_at = new Date().toISOString();
          }
          
          // Add to database
          inMemoryDB[table].push(data);
          saveToStorage();
          
          return { error: null };
        } catch (error) {
          return { error: error as unknown as PostgrestError };
        }
      },
      
      // Update operation
      update(data: any) {
        const updateQuery = {
          ...query,

          eq: (field: string, value: any) => {
            query._filters.push({field, value, operator: 'eq'});
            return updateQuery;
          },

          async then(callback?: (result: SupabaseInsertUpdateResponse) => void): Promise<SupabaseInsertUpdateResponse> {
            let result: SupabaseInsertUpdateResponse;
            
            try {
              let results = [...inMemoryDB[table]];
              let updated = false;
              
              // Apply filters and update matches
              for (let i = 0; i < results.length; i++) {
                let match = true;
                
                for (const filter of query._filters) {
                  if (filter.operator === 'eq' && results[i][filter.field] !== filter.value) {
                    match = false;
                    break;
                  }
                }
                
                if (match) {
                  inMemoryDB[table][i] = { ...results[i], ...data };
                  updated = true;
                }
              }
              
              if (updated) {
                saveToStorage();
              }
              
              result = { error: null };
            } catch (error) {
              result = { error: error as unknown as PostgrestError };
            }
            
            // Call the callback if provided
            if (callback) {
              callback(result);
            }
            
            return result;
          }
        };
        
        return updateQuery;
      },
      
      // Delete operation
      async delete(): Promise<SupabaseInsertUpdateResponse> {
        try {
          let initialLength = inMemoryDB[table].length;
          
          // Apply filters to remove matching items
          inMemoryDB[table] = inMemoryDB[table].filter(item => {
            for (const filter of query._filters) {
              if (filter.operator === 'eq' && item[filter.field] === filter.value) {
                return false;
              }
            }
            return true;
          });
          
          if (initialLength !== inMemoryDB[table].length) {
            saveToStorage();
          }
          
          return { error: null };
        } catch (error) {
          return { error: error as unknown as PostgrestError };
        }
      }
    };
    
    return query;
  },
  
  // Helper functions for database operations
  rpc: (functionName: string, params?: any) => {
    // Mock RPC functions
    switch (functionName) {
      case 'increment':
        // For incrementing values
        return { __rpc: 'increment' };
      
      case 'decrement':
        // For decrementing values with a minimum
        return { __rpc: 'decrement', min_val: params?.min_val || 0 };
      
      default:
        return null;
    }
  }
};

// Initialize with sample data for testing
if (inMemoryDB.profiles.length === 0) {
  inMemoryDB.profiles.push({
    id: 'user_123456789',
    username: 'nemo_player',
    email: 'player@example.com',
    games_played: 5,
    games_remaining: 5,
    last_reset: new Date().toISOString(),
    created_at: new Date().toISOString()
  });
  
  // Add some sample scores
  inMemoryDB.scores.push({
    id: '1',
    user_id: 'user_123456789',
    score: 10500,
    distance: 1050,
    created_at: new Date().toISOString()
  });
  
  saveToStorage();
}