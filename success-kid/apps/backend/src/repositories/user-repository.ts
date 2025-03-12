/**
 * User Repository
 * 
 * Handles data access for users
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { User, NewUserInput, UserUpdateInput } from '../models/user';
import { logger } from '../lib/logger';

export class UserRepository extends BaseRepository<User> {
  constructor(db: Pool) {
    super(db, 'users', 'id');
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.db.query<User>(query, [email]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(input: NewUserInput): Promise<User> {
    try {
      return await this.create({
        ...input,
        created_at: new Date(),
        last_login: new Date(),
        status: 'active'
      });
    } catch (error) {
      logger.error('Error creating user', { error, input });
      throw error;
    }
  }

  /**
   * Update a user's last login date
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
      logger.error('Error updating user last login', { error, id });
      throw error;
    }
  }

  /**
   * Find users by display name search
   */
  async searchByDisplayName(searchTerm: string, limit: number = 10): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM users
        WHERE display_name ILIKE $1
        ORDER BY display_name
        LIMIT $2
      `;
      
      const result = await this.db.query<User>(query, [`%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching users by display name', { error, searchTerm });
      throw error;
    }
  }

  /**
   * Get recent users by signup date
   */
  async getRecentUsers(limit: number = 10): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT $1
      `;
      
      const result = await this.db.query<User>(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent users', { error, limit });
      throw error;
    }
  }
}
