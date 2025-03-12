import { FastifyInstance } from 'fastify';
import { User } from '../models/user';
import { UserRepository } from '../repositories/user-repository';
import { ValidationError } from '../lib/errors';

/**
 * Service for user-related business logic
 * Implements the service layer pattern for business logic abstraction
 */
export class UserService {
  private userRepository: UserRepository;
  
  constructor(fastify: FastifyInstance) {
    this.userRepository = new UserRepository(fastify);
  }
  
  /**
   * Get a user by ID
   * 
   * @param id User ID
   * @returns User object
   */
  async getUserById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }
  
  /**
   * Create a new user
   * 
   * @param userData User data to create
   * @returns Created user
   * @throws ValidationError if email already exists
   */
  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already in use', {
        email: 'This email is already registered'
      });
    }
    
    // Create user
    return this.userRepository.create(userData);
  }
  
  /**
   * Update a user
   * 
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    // Validate email uniqueness if changing email
    if (userData.email) {
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new ValidationError('Email already in use', {
          email: 'This email is already registered'
        });
      }
    }
    
    // Update user
    return this.userRepository.update(id, userData);
  }
}