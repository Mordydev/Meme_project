/**
 * Base Repository
 * 
 * Abstract class for data access repositories following the repository pattern.
 * Provides common CRUD operations and transaction handling.
 */
import { Pool, PoolClient } from 'pg';
import { logger } from '../../lib/logger';
import { DatabaseError, NotFoundError } from '../../errors';

/**
 * Base Repository abstract class
 * T represents the entity type
 * ID represents the primary key type (default: string for UUIDs)
 */
export abstract class BaseRepository<T, ID = string> {
  /**
   * Table name for the repository
   */
  protected abstract tableName: string;
  
  /**
   * Primary key column name
   */
  protected primaryKey: string = 'id';
  
  /**
   * Constructor
   * @param db PostgreSQL pool for database access
   */
  constructor(protected db: Pool) {}
  
  /**
   * Find entity by ID
   * @param id Entity ID
   * @returns Entity if found, null otherwise
   */
  async findById(id: ID): Promise<T | null> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
      `;
      
      const result = await this.db.query<T>(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findById:`, error);
      throw new DatabaseError(`Failed to find ${this.tableName} by ID`, error as Error);
    }
  }
  
  /**
   * Find entity by ID or throw error if not found
   * @param id Entity ID
   * @returns Entity
   * @throws NotFoundError if entity not found
   */
  async findByIdOrThrow(id: ID): Promise<T> {
    const entity = await this.findById(id);
    
    if (!entity) {
      throw new NotFoundError(this.tableName, id as string);
    }
    
    return entity;
  }
  
  /**
   * Find all entities
   * @param options Optional find options (limit, offset, etc.)
   * @returns Array of entities
   */
  async findAll(options: FindOptions = {}): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add WHERE clause if filters provided
      if (options.where && Object.keys(options.where).length > 0) {
        const whereConditions = Object.entries(options.where).map(([key, _]) => {
          return `${key} = $${paramIndex++}`;
        });
        
        query += ` WHERE ${whereConditions.join(' AND ')}`;
        
        params.push(...Object.values(options.where));
      }
      
      // Add ORDER BY clause if sort provided
      if (options.orderBy) {
        const { field, direction } = options.orderBy;
        query += ` ORDER BY ${field} ${direction || 'ASC'}`;
      } else {
        // Default sort by primary key
        query += ` ORDER BY ${this.primaryKey} ASC`;
      }
      
      // Add pagination
      if (options.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(options.limit);
      }
      
      if (options.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(options.offset);
      }
      
      const result = await this.db.query<T>(query, params);
      return result.rows;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findAll:`, error);
      throw new DatabaseError(`Failed to find ${this.tableName} entities`, error as Error);
    }
  }
  
  /**
   * Count entities
   * @param where Optional filter conditions
   * @returns Count of entities
   */
  async count(where: Record<string, any> = {}): Promise<number> {
    try {
      let query = `SELECT COUNT(*) FROM ${this.tableName}`;
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add WHERE clause if filters provided
      if (Object.keys(where).length > 0) {
        const whereConditions = Object.entries(where).map(([key, _]) => {
          return `${key} = $${paramIndex++}`;
        });
        
        query += ` WHERE ${whereConditions.join(' AND ')}`;
        
        params.push(...Object.values(where));
      }
      
      const result = await this.db.query<{ count: string }>(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.count:`, error);
      throw new DatabaseError(`Failed to count ${this.tableName} entities`, error as Error);
    }
  }
  
  /**
   * Create a new entity
   * @param data Entity data (without ID)
   * @returns Created entity
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columnNames})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error in ${this.tableName}.create:`, error);
      throw new DatabaseError(`Failed to create ${this.tableName} entity`, error as Error);
    }
  }
  
  /**
   * Update an entity
   * @param id Entity ID
   * @param data Entity data to update
   * @returns Updated entity
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      
      if (columns.length === 0) {
        // Nothing to update
        return this.findByIdOrThrow(id);
      }
      
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.primaryKey} = $${columns.length + 1}
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, [...values, id]);
      
      if (result.rowCount === 0) {
        throw new NotFoundError(this.tableName, id as string);
      }
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error(`Error in ${this.tableName}.update:`, error);
      throw new DatabaseError(`Failed to update ${this.tableName} entity`, error as Error);
    }
  }
  
  /**
   * Delete an entity
   * @param id Entity ID
   * @returns true if deleted, false if not found
   */
  async delete(id: ID): Promise<boolean> {
    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE ${this.primaryKey} = $1
      `;
      
      const result = await this.db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.delete:`, error);
      throw new DatabaseError(`Failed to delete ${this.tableName} entity`, error as Error);
    }
  }
  
  /**
   * Execute a function within a transaction
   * @param callback Function to execute within transaction
   * @returns Result of callback
   */
  async withTransaction<R>(callback: (client: PoolClient) => Promise<R>): Promise<R> {
    const client = await this.db.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Execute callback with transaction client
      const result = await callback(client);
      
      // Commit transaction
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  }
}

/**
 * Find options for repository queries
 */
export interface FindOptions {
  where?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction?: 'ASC' | 'DESC';
  };
}