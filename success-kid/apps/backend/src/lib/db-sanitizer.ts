/**
 * Database Sanitizer
 * 
 * Utilities for safely handling database input/output and conversion between
 * camelCase (TypeScript) and snake_case (PostgreSQL)
 */

/**
 * Convert camelCase object keys to snake_case for database operations
 * 
 * @param obj Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function toDatabaseFormat(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = camelToSnake(key);
      const value = obj[key];
      
      // Handle nested objects and arrays
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          result[snakeKey] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? toDatabaseFormat(item) 
              : item
          );
        } else {
          result[snakeKey] = toDatabaseFormat(value);
        }
      } else {
        result[snakeKey] = value;
      }
    }
  }
  
  return result;
}

/**
 * Convert snake_case object keys to camelCase for JavaScript/TypeScript
 * 
 * @param obj Object with snake_case keys
 * @returns Object with camelCase keys
 */
export function fromDatabaseFormat(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = snakeToCamel(key);
      const value = obj[key];
      
      // Handle nested objects and arrays
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          result[camelKey] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? fromDatabaseFormat(item) 
              : item
          );
        } else {
          result[camelKey] = fromDatabaseFormat(value);
        }
      } else {
        result[camelKey] = value;
      }
    }
  }
  
  return result;
}

/**
 * Helper to convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Helper to convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Parse JSONB fields from database into JS objects
 * 
 * @param entity Database entity with potential JSONB fields
 * @param jsonFields Array of field names that should be parsed as JSON
 * @returns Entity with parsed JSON fields
 */
export function parseJsonFields<T>(
  entity: T,
  jsonFields: string[]
): T {
  if (!entity) return entity;
  
  const result = { ...entity };
  
  for (const field of jsonFields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (error) {
        // Leave as is if not valid JSON
      }
    }
  }
  
  return result;
}

/**
 * Sanitize SQL input to prevent injection
 * 
 * @param input SQL input string to sanitize
 * @returns Sanitized string safe for queries
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\'); // Escape backslashes
}
