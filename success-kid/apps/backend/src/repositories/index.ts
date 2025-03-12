/**
 * Repository Exports
 * 
 * Centralizes export of all repositories and provides factory functions
 * for creating repositories with the database connection.
 */
import { Pool } from 'pg';
import { getPgPool } from '../lib/db-client';
import { UserRepository } from './user-repository';

// Repository factory functions
export function createUserRepository(db?: Pool): UserRepository {
  return new UserRepository(db || getPgPool());
}

// Export individual repositories for direct import
export { UserRepository } from './user-repository';

// Export repository base classes
export { BaseRepository, Repository } from './base-repository';

/**
 * Create a repositories object with all repositories
 * @param db Optional database connection
 * @returns Object containing all repository instances
 */
export function createRepositories(db?: Pool) {
  const pool = db || getPgPool();
  
  return {
    users: new UserRepository(pool),
    // Add other repositories here as they are implemented
  };
}

// Default export of repository factory
export default {
  createUserRepository,
  createRepositories,
};