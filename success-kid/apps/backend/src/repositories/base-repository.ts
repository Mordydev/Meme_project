/**
 * Base Repository
 * 
 * Abstract class that provides common CRUD operations for database access.
 * Used as a base class for specific entity repositories.
 */
import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../lib/logger';

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: Partial<T>): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export abstract class BaseRepository<T> implements Repository<T> {
  constructor(
    protected db: Pool,
    protected tableName: string,
    protected idColumn: string = 'id'
  ) {}

  /**
   * Find an entity by its ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = $1`;
      const result = await this.db.query<T>(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by ID`, { 
        error, 
        tableName: this.tableName, 
        id 
      });
      throw error;
    }
  }

  /**
   * Find all entities matching the given filters
   */
  async findAll(filters: Partial<T> = {}): Promise<T[]> {
    try {
      const filterKeys = Object.keys(filters);
      
      if (filterKeys.length === 0) {
        const result = await this.db.query<T>(`SELECT * FROM ${this.tableName}`);
        return result.rows;
      }
      
      const placeholders = filterKeys.map((key, index) => `${key} = $${index + 1}`);
      const values = filterKeys.map(key => (filters as any)[key]);
      
      const query = `SELECT * FROM ${this.tableName} WHERE ${placeholders.join(' AND ')}`;
      const result = await this.db.query<T>(query, values);
      
      return result.rows;
    } catch (error) {
      logger.error(`Error finding ${this.tableName} with filters`, { 
        error, 
        tableName: this.tableName, 
        filters 
      });
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async create(entity: Partial<T>): Promise<T> {
    try {
      const keys = Object.keys(entity);
      const placeholders = keys.map((_, index) => `$${index + 1}`);
      const columns = keys.join(', ');
      const values = keys.map(key => (entity as any)[key]);
      
      const query = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating ${this.tableName}`, { error, tableName: this.tableName, entity });
      throw error;
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: string, entity: Partial<T>): Promise<T | null> {
    try {
      const keys = Object.keys(entity);
      
      if (keys.length === 0) {
        return this.findById(id);
      }
      
      const placeholders = keys.map((key, index) => `${key} = $${index + 1}`);
      const values = keys.map(key => (entity as any)[key]);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${placeholders.join(', ')}
        WHERE ${this.idColumn} = $${values.length + 1}
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, [...values, id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error updating ${this.tableName}`, { 
        error, 
        tableName: this.tableName, 
        id,
        entity 
      });
      throw error;
    }
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $1`;
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}`, { 
        error, 
        tableName: this.tableName, 
        id 
      });
      throw error;
    }
  }

  /**
   * Execute a function within a database transaction
   */
  protected async executeTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rollback', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Count entities matching the given filters
   */
  async count(filters: Partial<T> = {}): Promise<number> {
    try {
      const filterKeys = Object.keys(filters);
      
      if (filterKeys.length === 0) {
        const result = await this.db.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${this.tableName}`);
        return parseInt(result.rows[0].count, 10);
      }
      
      const placeholders = filterKeys.map((key, index) => `${key} = $${index + 1}`);
      const values = filterKeys.map(key => (filters as any)[key]);
      
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${placeholders.join(' AND ')}`;
      const result = await this.db.query<{ count: string }>(query, values);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error counting ${this.tableName}`, { 
        error, 
        tableName: this.tableName, 
        filters 
      });
      throw error;
    }
  }
}
