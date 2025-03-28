import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository'; // Import the base class
import { users, profiles, User, Profile, NewUser, NewProfile } from '../database/schema/users'; // Import schema and types
import { db } from '../database'; // Import db instance
import { Logger } from 'pino';

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../lib/logger.js'); // Using require for CommonJS
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger.js', using console.", e);
  logger = console as any;
}

// Define the specific entity type for the repository
type UserEntity = User; // Using the inferred type from schema/users.ts

export class UserRepository extends BaseRepository<UserEntity, typeof users, NewUser> {
  constructor() {
    // Pass the table schema, primary key column, and optional column mapping to the base constructor
    super(
        users,
        users.id, // The primary key column object
        { // Optional mapping for sorting/filtering convenience
            email: users.email,
            displayName: users.displayName,
            status: users.status,
            authProvider: users.authProvider,
            createdAt: users.createdAt
        }
    );
  }

  /**
   * Finds a user by their email address.
   * @param email The email address to search for.
   * @returns The User entity if found, otherwise null.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const result = await db
        .select()
        .from(this.table) // Use this.table from base class
        .where(eq(users.email, email))
        .limit(1);

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      this.logError('findByEmail', error, { email }); // Use logError from base class
      throw this.wrapError('Failed to find user by email', error); // Use wrapError from base class
    }
  }

  /**
   * Creates a new user along with their profile in a single transaction.
   * @param userData Data for the new user.
   * @param profileData Data for the new user's profile.
   * @returns The newly created User entity.
   */
  async createWithProfile(userData: NewUser, profileData: Omit<NewProfile, 'userId'>): Promise<UserEntity> {
    // Use the transaction method from the base class
    return this.transaction(async (trx) => {
      logger.info('Creating user with profile within transaction', { email: userData.email });
      // Create user using base class 'create' method within transaction context
      // Note: Base 'create' expects the full insert type (NewUser)
      const newUser = await trx.insert(users).values(userData).returning();
      const user = this.mapToEntity(newUser[0]); // Map the raw result

      if (!user) {
          throw new Error('User creation failed within transaction.');
      }

      logger.info(`User created (id: ${user.id}), creating profile...`);

      // Create profile directly using trx context
      await trx
        .insert(profiles)
        .values({
          userId: user.id, // Use the ID from the newly created user
          ...profileData
        });

       logger.info(`Profile created for user ${user.id}`);

      return user; // Return the mapped User entity
    });
  }

  /**
   * Retrieves a user along with their associated profile.
   * @param userId The ID of the user to retrieve.
   * @returns An object containing the user and profile, or null if not found.
   */
  async getUserWithProfile(userId: string): Promise<{ user: UserEntity; profile: Profile | null } | null> {
    try {
      const result = await db
        .select({
          user: users, // Select all columns from users table
          profile: profiles // Select all columns from profiles table
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId)) // Left join to include users without profiles
        .where(eq(users.id, userId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      // Map the user part using the required mapToEntity method
      // Profile part can be used directly as it matches the Profile type (or null)
      return {
        user: this.mapToEntity(result[0].user),
        profile: result[0].profile ? result[0].profile as Profile : null
      };
    } catch (error) {
      this.logError('getUserWithProfile', error, { userId });
      throw this.wrapError('Failed to get user with profile', error);
    }
  }

  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the UserEntity type.
   * @param record The raw database record.
   * @returns The mapped UserEntity.
   */
  protected mapToEntity(record: Record<string, any>): UserEntity {
    // Perform mapping from the raw DB record to the User type
    // This ensures the object returned by repository methods matches the expected entity shape.
    return {
      id: record.id,
      email: record.email,
      displayName: record.displayName, // Ensure correct mapping if column names differ (e.g., display_name)
      authProvider: record.authProvider,
      createdAt: record.createdAt,
      lastLogin: record.lastLogin,
      status: record.status
      // Add any other fields defined in the User type
    };
  }

  // Override mapToDatabase if needed (e.g., for snake_case conversion)
  // protected mapToDatabase(entity: Partial<UserEntity | NewUser>): Record<string, any> {
  //   // Example: Convert camelCase entity fields to snake_case database columns if necessary
  //   const dbRecord: Record<string, any> = {};
  //   if (entity.displayName !== undefined) dbRecord.display_name = entity.displayName;
  //   if (entity.authProvider !== undefined) dbRecord.auth_provider = entity.authProvider;
  //   // ... map other fields ...
  //   return { ...entity, ...dbRecord }; // Merge mapped fields with original entity
  // }
}

// Export a singleton instance
export const userRepository = new UserRepository();
