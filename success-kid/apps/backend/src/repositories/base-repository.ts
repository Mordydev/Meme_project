/**
 * Base Repository
 * 
 * Abstract base class for database repositories, providing common CRUD operations
 * and transaction management. All entity-specific repositories should extend this class.
 */
import { Pool, PoolClient, QueryConfig, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseError } from '../errors';
import { logger } from '../lib/logger';

/**
 * Query options for repository methods
 */
export interface QueryOptions {
  filter?: Record<string, any>;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Base repository interface
 */
export interface IBaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findOne(filter: Partial<T>): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}

/**
 * Abstract base repository implementation
 */
export abstract class BaseRepository<T, ID = string> implements IBaseRepository<T, ID> {
  /**
   * Constructor
   * 
   * @param db Database connection pool
   * @param tableName Name of the database table
   * @param idColumn Name of the ID column (defaults to 'id')
   */
  constructor(
    protected readonly db: Pool,
    protected readonly tableName: string,
    protected readonly idColumn: string = 'id'
  ) {}

  /**
   * Find an entity by ID
   * 
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: ID): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = $1`;
      const result = await this.db.query<T>(query, [id]);
      
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findById:`, { error, id });
      throw new DatabaseError(`Failed to find ${this.tableName} by ID`, error);
    }
  }

  /**
   * Find a single entity by filter criteria
   * 
   * @param filter Filter criteria
   * @returns Entity or null if not found
   */
  async findOne(filter: Partial<T>): Promise<T | null> {
    try {
      const { text, values } = this.buildWhereClause(filter);
      
      const query = `SELECT * FROM ${this.tableName} ${text} LIMIT 1`;
      const result = await this.db.query<T>(query, values);
      
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findOne:`, { error, filter });
      throw new DatabaseError(`Failed to find ${this.tableName} with filter`, error);
    }
  }

  /**
   * Find all entities with optional filtering and pagination
   * 
   * @param options Query options for filtering, sorting, and pagination
   * @returns Array of entities
   */
  async findAll(options?: QueryOptions): Promise<T[]> {
    try {
      const { text, values } = this.buildQuery(options);
      
      const result = await this.db.query<T>(text, values);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findAll:`, { error, options });
      throw new DatabaseError(`Failed to find all ${this.tableName}`, error);
    }
  }

  /**
   * Create a new entity
   * 
   * @param data Entity data
   * @returns Created entity
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      // Generate ID if not provided
      const entityData: any = {
        id: uuidv4(),
        ...data,
      };
      
      // Extract columns and values
      const columns = Object.keys(entityData);
      const values = Object.values(entityData);
      
      // Build parameterized query
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columnNames})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, values);
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.create:`, { error, data });
      throw new DatabaseError(`Failed to create ${this.tableName}`, error);
    }
  }

  /**
   * Update an entity
   * 
   * @param id Entity ID
   * @param data Entity data to update
   * @returns Updated entity or null if not found
   */
  async update(id: ID, data: Partial<T>): Promise<T | null> {
    try {
      // Extract columns and values for UPDATE
      const entries = Object.entries(data);
      
      // Skip update if no data provided
      if (entries.length === 0) {
        return this.findById(id);
      }
      
      // Build SET clause
      const setClauses = entries.map((entry, i) => `${entry[0]} = $${i + 2}`);
      const setClause = setClauses.join(', ');
      
      // Build query
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.idColumn} = $1
        RETURNING *
      `;
      
      // Build values array
      const values = [id, ...entries.map(entry => entry[1])];
      
      const result = await this.db.query<T>(query, values);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.update:`, { error, id, data });
      throw new DatabaseError(`Failed to update ${this.tableName}`, error);
    }
  }

  /**
   * Delete an entity
   * 
   * @param id Entity ID
   * @returns True if entity was deleted, false if not found
   */
  async delete(id: ID): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $1`;
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.delete:`, { error, id });
      throw new DatabaseError(`Failed to delete ${this.tableName}`, error);
    }
  }

  /**
   * Count entities with optional filter
   * 
   * @param filter Optional filter criteria
   * @returns Number of entities
   */
  async count(filter?: Partial<T>): Promise<number> {
    try {
      let query = `SELECT COUNT(*) FROM ${this.tableName}`;
      const values: any[] = [];
      
      // Apply filter if provided
      if (filter && Object.keys(filter).length > 0) {
        const whereClause = this.buildWhereClause(filter);
        query += ` ${whereClause.text}`;
        values.push(...whereClause.values);
      }
      
      const result = await this.db.query<{ count: string }>(query, values);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.count:`, { error, filter });
      throw new DatabaseError(`Failed to count ${this.tableName}`, error);
    }
  }

  /**
   * Execute a raw SQL query
   * 
   * @param text SQL query text
   * @param values Query parameters
   * @returns Query result
   */
  protected async query<R>(text: string, values: any[] = []): Promise<QueryResult<R>> {
    try {
      return await this.db.query<R>(text, values);
    } catch (error) {
      logger.error(`Error executing query on ${this.tableName}:`, { error, text, values });
      throw new DatabaseError(`Query execution failed for ${this.tableName}`, error);
    }
  }

  /**
   * Execute a function within a database transaction
   * 
   * @param callback Function to execute within the transaction
   * @returns Result of the callback function
   */
  protected async withTransaction<R>(callback: (client: PoolClient) => Promise<R>): Promise<R> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Transaction failed in ${this.tableName}:`, { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Build a parameterized SQL query with optional filtering, sorting, and pagination
   * 
   * @param options Query options
   * @returns Query object with text and parameter values
   */
  protected buildQuery(options?: QueryOptions): QueryConfig {
    const parts: string[] = [`SELECT * FROM ${this.tableName}`];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add WHERE clauses if filter provided
    if (options?.filter && Object.keys(options.filter).length > 0) {
      const whereConditions: string[] = [];
      
      Object.entries(options.filter).forEach(([key, value]) => {
        values.push(value);
        whereConditions.push(`${key} = $${paramIndex++}`);
      });
      
      parts.push(`WHERE ${whereConditions.join(' AND ')}`);
    }
    
    // Add ORDER BY if specified
    if (options?.orderBy) {
      const direction = options.orderDir === 'desc' ? 'DESC' : 'ASC';
      parts.push(`ORDER BY ${options.orderBy} ${direction}`);
    } else {
      // Default ordering by created_at if exists
      const hasCreatedAt = this.createdAtColumn !== null;
      if (hasCreatedAt) {
        parts.push(`ORDER BY ${this.createdAtColumn} DESC`);
      }
    }
    
    // Add LIMIT and OFFSET if specified
    if (options?.limit) {
      values.push(options.limit);
      parts.push(`LIMIT $${paramIndex++}`);
      
      if (options.offset) {
        values.push(options.offset);
        parts.push(`OFFSET $${paramIndex++}`);
      }
    }
    
    return {
      text: parts.join(' '),
      values
    };
  }

  /**
   * Build a WHERE clause from filter criteria
   * 
   * @param filter Filter criteria
   * @returns WHERE clause text and parameter values
   */
  protected buildWhereClause(filter: Record<string, any>): { text: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else {
        values.push(value);
        conditions.push(`${key} = $${paramIndex++}`);
      }
    });
    
    const text = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    return { text, values };
  }

  /**
   * Convert a database row to an entity object
   * Must be implemented by derived classes
   * 
   * @param row Database row
   * @returns Entity instance
   */
  protected abstract mapToEntity(row: Record<string, any>): T;

  /**
   * Get the name of the created_at column (for sorting)
   * Can be overridden by subclasses if different
   */
  protected get createdAtColumn(): string | null {
    return 'created_at';
  }
}
