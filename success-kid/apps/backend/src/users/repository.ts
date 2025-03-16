import { Pool } from 'pg';
import { User, CreateUserDto, UpdateUserDto } from './types';
import { logger } from '../lib/logger';

/**
 * Repository for user data access
 */
export class UserRepository {
  constructor(private db: Pool) {}
  
  /**
   * Get a user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await this.db.query<User>(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID', { id, error });
      throw error;
    }
  }
  
  /**
   * Get a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.db.query<User>(query, [email]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { email, error });
      throw error;
    }
  }
  
  /**
   * Create a new user
   */
  async create(user: CreateUserDto): Promise<User> {
    try {
      const query = `
        INSERT INTO users (
          id, email, display_name, auth_provider, created_at, last_login, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await this.db.query<User>(query, [
        user.id,
        user.email,
        user.display_name,
        user.auth_provider,
        user.created_at || new Date(),
        user.last_login || new Date(),
        user.status || 'active'
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user', { user, error });
      throw error;
    }
  }
  
  /**
   * Update a user
   */
  async update(id: string, data: UpdateUserDto): Promise<User | null> {
    try {
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Add each field to update
      if (data.display_name !== undefined) {
        updates.push(`display_name = $${paramIndex++}`);
        values.push(data.display_name);
      }
      
      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      
      if (data.auth_provider !== undefined) {
        updates.push(`auth_provider = $${paramIndex++}`);
        values.push(data.auth_provider);
      }
      
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      
      if (data.last_login !== undefined) {
        updates.push(`last_login = $${paramIndex++}`);
        values.push(data.last_login);
      }
      
      // If no updates, return current user
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      // Add id as the last parameter
      values.push(id);
      
      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await this.db.query<User>(query, values);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user', { id, data, error });
      throw error;
    }
  }
  
  /**
   * Update user's last login time
   */
  async updateLastLogin(id: string): Promise<User | null> {
    try {
      const query = `
        UPDATE users
        SET last_login = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query<User>(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user last login', { id, error });
      throw error;
    }
  }
  
  /**
   * Soft delete a user (mark as deleted)
   */
  async softDelete(id: string): Promise<boolean> {
    try {
      const query = `
        UPDATE users
        SET status = 'deleted'
        WHERE id = $1
      `;
      
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error soft deleting user', { id, error });
      throw error;
    }
  }
  
  /**
   * Hard delete a user (remove from database)
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error hard deleting user', { id, error });
      throw error;
    }
  }
  
  /**
   * Find users by search criteria
   */
  async search(options: {
    query?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const { query, status, limit = 10, offset = 0 } = options;
      
      // Build query conditions
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (query) {
        conditions.push(`(display_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        values.push(`%${query}%`);
        paramIndex++;
      }
      
      if (status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }
      
      // Build WHERE clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Count total matching users
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users
        ${whereClause}
      `;
      
      const countResult = await this.db.query<{ total: string }>(countQuery, values);
      const total = parseInt(countResult.rows[0].total, 10);
      
      // Get paginated users
      const usersQuery = `
        SELECT *
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const userValues = [...values, limit, offset];
      const usersResult = await this.db.query<User>(usersQuery, userValues);
      
      return {
        users: usersResult.rows,
        total
      };
    } catch (error) {
      logger.error('Error searching users', { options: { ...options }, error });
      throw error;
    }
  }
}
