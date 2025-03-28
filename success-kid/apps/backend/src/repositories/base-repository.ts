import { SQL, eq, and, desc, asc, count as drizzleCount } from 'drizzle-orm';
import { PgTable, PgColumn, PgTransaction } from 'drizzle-orm/pg-core'; // Import PgTransaction
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'; // Import specific HKT if needed, adjust based on driver
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { db } from '../database'; // Assuming db client from ../database/index.ts
import { schema } from '../database/schema'; // Import the combined schema
import { Logger } from 'pino'; // Assuming pino logger

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../lib/logger.js'); // Using require for CommonJS
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger.js', using console.", e);
  logger = console as any;
}

// Interface for query options, including filtering, sorting, and pagination
export interface QueryOptions<T> {
  filter?: Partial<T>;
  orderBy?: keyof T;
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Abstract base class for repositories
export abstract class BaseRepository<
    TEntity, // The entity type (e.g., User, Content) - Maps to the select model
    TTable extends PgTable, // The Drizzle table schema (e.g., typeof users)
    TInsertSchema = typeof TTable.$inferInsert // Infer the insert type
> {
  /**
   * Constructor for the BaseRepository.
   * @param table The Drizzle table schema instance.
   * @param idColumn The primary key column of the table.
   * @param columns Optional mapping of entity keys to table columns for filtering/sorting.
   */
  constructor(
    protected readonly table: TTable,
    protected readonly idColumn: PgColumn, // Specify that idColumn is a PgColumn
    protected readonly columns?: Record<string, PgColumn> // Keep columns optional
  ) {}

  /**
   * Finds a single entity by its primary key ID.
   * @param id The ID of the entity to find.
   * @returns The entity if found, otherwise null.
   */
  async findById(id: string | number): Promise<TEntity | null> { // Allow number IDs too
    try {
      // Use 'any' for the column type in eq() if idColumn type is complex
      // Add 'as any' to from() if type errors persist
      const result = await db
        .select()
        .from(this.table as any)
        .where(eq(this.idColumn as any, id))
        .limit(1);

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      this.logError('findById', error, { id });
      throw this.wrapError('Failed to find entity by ID', error);
    }
  }

  /**
   * Finds multiple entities based on query options (filtering, sorting, pagination).
   * @param options Query options including filter, orderBy, orderDir, limit, offset.
   * @returns An array of found entities.
   */
  async findMany(options: QueryOptions<TEntity> = {}): Promise<TEntity[]> {
    try {
      const { filter = {}, orderBy, orderDir = 'desc', limit, offset } = options;

      // Start building the query
      // Add 'as any' to from() if type errors persist
      let query = db.select().from(this.table as any) as any; // Use 'as any' to allow dynamic query building

      // Apply filters
      const conditions = this.buildFilterConditions(filter);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      if (orderBy) {
        // Use the mapped column (with optional chaining) or fallback to access via table._.columns
        const sortColumn = this.columns?.[orderBy as string] || this.table._.columns[orderBy as string];
        if (sortColumn) {
            if (orderDir === 'asc') {
                query = query.orderBy(asc(sortColumn));
            } else {
                query = query.orderBy(desc(sortColumn));
            }
        } else {
            logger.warn(`OrderBy column '${String(orderBy)}' not found in table or column map.`);
        }
      } else {
          // Default sort by ID if no orderBy specified
          query = query.orderBy(desc(this.idColumn));
      }

      // Apply pagination
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.offset(offset);
      }

      // Execute query
      const results = await query;

      // Map results to entities
      return results.map((result: any) => this.mapToEntity(result));
    } catch (error) {
      this.logError('findMany', error, { options });
      throw this.wrapError('Failed to find entities', error);
    }
  }

  /**
   * Creates a new entity in the database.
   * @param data The data for the new entity, conforming to the insert schema.
   * @returns The newly created entity.
   */
  async create(data: TInsertSchema): Promise<TEntity> {
    try {
      // mapToDatabase might not be needed if TInsertSchema is used directly
      const results = await db
        .insert(this.table)
        .values(data as any) // Use 'as any' for now if TInsertSchema causes issues
        .returning(); // Return the full inserted record

      // Handle potential empty result from returning()
      const result = results[0];

      if (!result) {
          throw new Error('Entity creation failed, no result returned.');
      }
      return this.mapToEntity(result);
    } catch (error) {
      this.logError('create', error, { data });
      throw this.wrapError('Failed to create entity', error);
    }
  }

  /**
   * Updates an existing entity by its ID.
   * @param id The ID of the entity to update.
   * @param data The partial data containing updates, conforming to the insert schema.
   * @returns The updated entity if found and updated, otherwise null.
   */
  async update(id: string | number, data: Partial<TInsertSchema>): Promise<TEntity | null> {
    try {
      // mapToDatabase might not be needed if TInsertSchema is used directly
      // Remove undefined values to avoid setting columns to null unintentionally
      const updateData = { ...data }; // Clone to avoid modifying original
      Object.keys(updateData).forEach(key => updateData[key as keyof TInsertSchema] === undefined && delete updateData[key as keyof TInsertSchema]);

      // Check if there's anything to update after removing undefined keys
      if (Object.keys(updateData).length === 0) { // Fix: Check updateData, not dbData
          logger.warn('Update called with no data to update', { id });
          return this.findById(id); // Return current entity if no changes
      }

      const results = await db
        .update(this.table)
        .set(updateData as any) // Use 'as any' for now if Partial<TInsertSchema> causes issues
        .where(eq(this.idColumn as any, id))
        .returning();

      // returning() returns an array, handle the case where it might be empty
      // Explicitly check if it's an array and has elements
      return Array.isArray(results) && results.length > 0 ? this.mapToEntity(results[0]) : null;
    } catch (error) {
      this.logError('update', error, { id, data });
      throw this.wrapError('Failed to update entity', error);
    }
  }

  /**
   * Deletes an entity by its ID.
   * @param id The ID of the entity to delete.
   * @returns True if an entity was deleted, false otherwise.
   */
  async delete(id: string | number): Promise<boolean> {
    try {
      const result = await db
        .delete(this.table)
        .where(eq(this.idColumn as any, id))
        .returning({ id: this.idColumn }); // Return the ID of the deleted row

      return result.length > 0;
    } catch (error) {
      this.logError('delete', error, { id });
      throw this.wrapError('Failed to delete entity', error);
    }
  }

  /**
   * Executes a callback within a database transaction.
   * @param callback The function to execute within the transaction. It receives a PgTransaction instance.
   * @returns The result of the callback function.
   */
  // Correct the transaction callback signature - use the imported 'schema'
  async transaction<R>(
      callback: (
          tx: PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
      ) => Promise<R>
  ): Promise<R> {
      // The schema context is usually inferred if the 'db' instance was created with it.
      // Removed the explicit schema option as it caused errors.
      return db.transaction(callback);
  }

  /**
   * Counts the total number of entities, optionally applying filters.
   * @param filter Optional filter criteria.
   * @returns The total count of matching entities.
   */
  async count(filter: Partial<TEntity> = {}): Promise<number> {
    try {
      // Start building the count query
      // Add 'as any' to from() if type errors persist
      let query = db.select({ value: drizzleCount() }).from(this.table as any) as any;

      // Apply filters
      const conditions = this.buildFilterConditions(filter);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query;
      return Number(result[0]?.value || 0);
    } catch (error) {
      this.logError('count', error, { filter });
      throw this.wrapError('Failed to count entities', error);
    }
  }

  /**
   * Builds an array of Drizzle SQL conditions based on a filter object.
   * @param filter The filter object.
   * @returns An array of SQL conditions.
   */
  protected buildFilterConditions(filter: Partial<TEntity>): SQL[] {
    const conditions: SQL[] = [];
    for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined) {
            // Use mapped column (with optional chaining) or fallback to access via table._.columns directly with string key
            const column = this.columns?.[key] || this.table._.columns[key];
            if (column) {
                conditions.push(eq(column, value));
            } else {
                 logger.warn(`Filter key '${key}' not found in table or column map.`);
            }
        }
    }
    return conditions;
  }

  /**
   * Logs an error message with context.
   * @param method The name of the repository method where the error occurred.
   * @param error The error object.
   * @param context Additional context for logging.
   */
  protected logError(method: string, error: any, context?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error in ${this.constructor.name}.${method}`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    });
  }

  /**
   * Wraps an error with a more specific message.
   * @param message The wrapping message.
   * @param error The original error.
   * @returns A new Error object.
   */
  protected wrapError(message: string, error: any): Error {
    const originalMessage = error instanceof Error ? error.message : String(error);
    const newError = new Error(`${message}: ${originalMessage}`);
    // Preserve stack trace if possible
    if (error instanceof Error) {
        newError.stack = error.stack;
    }
    return newError;
  }

  /**
   * Abstract method to map a raw database record to the entity type.
   * Must be implemented by concrete repository classes.
   * @param record The raw database record.
   * @returns The mapped entity.
   */
  protected abstract mapToEntity(record: Record<string, any>): TEntity;

  /**
   * Maps an entity object to a format suitable for database insertion/update.
   * Default implementation assumes entity keys match database column names.
   * Override in concrete classes if mapping is needed (e.g., camelCase to snake_case),
   * Maps an entity object to a format suitable for database insertion/update.
   * Default implementation assumes entity keys match database column names.
   * Override in concrete classes if mapping is needed (e.g., camelCase to snake_case),
   * ensuring the return type matches the expected insert/update schema.
   * @param entity The partial entity object.
   * @returns A record suitable for Drizzle's values() or set().
   */
   // Removing this for now to simplify and rely on TInsertSchema type inference
  // protected mapToDatabase(entity: Partial<TEntity | TInsertSchema>): Record<string, any> {
  //   // Default: return entity as is. Override if needed.
  //   return entity as Record<string, any>;
  // }
}
