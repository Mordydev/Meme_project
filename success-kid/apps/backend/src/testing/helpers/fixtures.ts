/**
 * Test Fixtures
 * 
 * Utilities for creating and managing test fixtures.
 */
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

/**
 * Test fixture interface
 */
export interface TestFixture<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
  get(key: string): T;
  cleanup(): Promise<void>;
}

/**
 * Create a memory-based test fixture
 * 
 * @param defaultFactory Factory function for creating instances
 * @returns Test fixture instance
 */
export function createMemoryFixture<T>(
  defaultFactory: (overrides?: Partial<T>) => T
): TestFixture<T> {
  const instances = new Map<string, T>();
  
  return {
    /**
     * Create a new instance
     * 
     * @param overrides Properties to override
     * @returns Created instance
     */
    create(overrides = {}): T {
      const instance = defaultFactory(overrides);
      const key = uuidv4();
      instances.set(key, instance);
      return instance;
    },
    
    /**
     * Create multiple instances
     * 
     * @param count Number of instances to create
     * @param overrides Properties to override
     * @returns Array of created instances
     */
    createMany(count, overrides = {}): T[] {
      return Array.from({ length: count }).map(() => this.create(overrides));
    },
    
    /**
     * Get an instance by key
     * 
     * @param key Instance key
     * @returns The instance
     */
    get(key: string): T {
      const instance = instances.get(key);
      if (!instance) {
        throw new Error(`Fixture instance not found: ${key}`);
      }
      return instance;
    },
    
    /**
     * Clean up all instances
     */
    async cleanup(): Promise<void> {
      instances.clear();
    }
  };
}

/**
 * Create a database-backed test fixture
 * 
 * @param dbPool Database connection pool
 * @param table Database table name
 * @param defaultFactory Factory function for creating instances
 * @param keyField Field name for instance key
 * @returns Test fixture instance
 */
export function createDatabaseFixture<T>(
  dbPool: Pool,
  table: string,
  defaultFactory: (overrides?: Partial<T>) => T,
  keyField: keyof T = 'id' as keyof T
): TestFixture<T> {
  const instances = new Map<string, T>();
  
  return {
    /**
     * Create a new instance and store in database
     * 
     * @param overrides Properties to override
     * @returns Created instance
     */
    async create(overrides = {}): Promise<T> {
      const instance = defaultFactory(overrides);
      const key = instance[keyField] as unknown as string;
      
      // Insert into database
      const client = await dbPool.connect();
      try {
        // Convert instance to columns and values
        const columns = Object.keys(instance);
        const values = Object.values(instance);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await client.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        
        // Store for later retrieval
        instances.set(key, instance);
        
        return instance;
      } finally {
        client.release();
      }
    },
    
    /**
     * Create multiple instances
     * 
     * @param count Number of instances to create
     * @param overrides Properties to override
     * @returns Array of created instances
     */
    async createMany(count, overrides = {}): Promise<T[]> {
      return Promise.all(
        Array.from({ length: count }).map(() => this.create(overrides))
      );
    },
    
    /**
     * Get an instance by key
     * 
     * @param key Instance key
     * @returns The instance
     */
    async get(key: string): Promise<T> {
      // Check if we have it in memory
      if (instances.has(key)) {
        return instances.get(key)!;
      }
      
      // Otherwise, fetch from database
      const client = await dbPool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM ${table} WHERE ${keyField as string} = $1`,
          [key]
        );
        
        if (result.rows.length === 0) {
          throw new Error(`Fixture instance not found: ${key}`);
        }
        
        const instance = result.rows[0] as T;
        instances.set(key, instance);
        
        return instance;
      } finally {
        client.release();
      }
    },
    
    /**
     * Clean up all instances
     */
    async cleanup(): Promise<void> {
      const client = await dbPool.connect();
      try {
        // Delete all created instances
        const keys = Array.from(instances.keys());
        if (keys.length > 0) {
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          await client.query(
            `DELETE FROM ${table} WHERE ${keyField as string} IN (${placeholders})`,
            keys
          );
        }
        
        // Clear in-memory cache
        instances.clear();
      } finally {
        client.release();
      }
    }
  };
}

export default {
  createMemoryFixture,
  createDatabaseFixture
};
