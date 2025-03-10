import { ProfileRepository } from '../repositories/profile-repository'
import { EventEmitter, EventType } from '../lib/events'
import { UserProfileModel } from '../models/user-profile'
import { logger } from '../lib/logger'
import { NotFoundError, ConflictError } from '../lib/errors'
import { CircuitBreaker } from '../lib/circuit-breaker'

/**
 * Service for handling user-related operations
 */
export class UserService {
  private readonly clerkCircuitBreaker: CircuitBreaker

  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly eventEmitter: EventEmitter,
    private readonly clerkClient: any, // Type from @clerk/fastify
    private readonly cacheService?: any // Optional cache service
  ) {
    // Initialize circuit breaker for Clerk API calls
    this.clerkCircuitBreaker = new CircuitBreaker('clerk-user-service', {
      failureThreshold: 3,  // 3 failures to trip the circuit
      resetTimeout: 30000,  // 30 seconds before trying again
      timeoutDuration: 5000 // 5 second timeout for operations
    })
  }

  /**
   * Get user profile with caching
   */
  async getProfile(userId: string): Promise<UserProfileModel> {
    // Try cache first if available
    if (this.cacheService) {
      const cacheKey = `user:profile:${userId}`
      const cached = await this.cacheService.get<UserProfileModel>(cacheKey)
      
      if (cached) {
        logger.debug({ userId }, 'User profile retrieved from cache')
        return cached
      }
    }
    
    // Get from database
    const profile = await this.profileRepository.getProfileByUserId(userId)
    
    if (!profile) {
      throw new NotFoundError('UserProfile', userId)
    }
    
    // Cache result if caching is available
    if (this.cacheService) {
      const cacheKey = `user:profile:${userId}`
      await this.cacheService.set(cacheKey, profile, 300) // 5 minutes TTL
    }
    
    return profile
  }

  /**
   * Get user profile by username
   */
  async getProfileByUsername(username: string): Promise<UserProfileModel> {
    const profile = await this.profileRepository.getProfileByUsername(username)
    
    if (!profile) {
      throw new NotFoundError('UserProfile', `username:${username}`)
    }
    
    return profile
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfileModel>): Promise<UserProfileModel> {
    // Get current profile to ensure it exists
    const currentProfile = await this.getProfile(userId)
    
    // If username is being updated, check for uniqueness
    if (updates.username && updates.username !== currentProfile.username) {
      const existing = await this.profileRepository.getProfileByUsername(updates.username)
      
      if (existing) {
        throw new ConflictError(`Username '${updates.username}' is already taken.`)
      }
    }
    
    // Update profile in database
    const updatedProfile = await this.profileRepository.updateProfile(userId, {
      ...updates,
      updatedAt: new Date()
    })
    
    // Clear cache if caching is available
    if (this.cacheService) {
      await this.cacheService.delete(`user:profile:${userId}`)
    }
    
    // Update Clerk metadata if necessary
    if (updates.username || updates.displayName) {
      try {
        // Only update what's relevant to Clerk
        const clerkUpdates: any = {}
        
        if (updates.displayName) {
          const nameParts = updates.displayName.split(' ')
          clerkUpdates.firstName = nameParts[0]
          clerkUpdates.lastName = nameParts.slice(1).join(' ')
        }
        
        if (updates.username) {
          clerkUpdates.username = updates.username
        }
        
        // Update Clerk if we have any updates
        if (Object.keys(clerkUpdates).length > 0) {
          await this.clerkCircuitBreaker.execute(() => 
            this.clerkClient.users.updateUser(userId, clerkUpdates)
          )
        }
      } catch (error) {
        // Log error but don't fail the request
        logger.error({ err: error, userId }, 'Failed to update Clerk user data')
      }
    }
    
    // Emit user updated event
    await this.eventEmitter.emit(EventType.USER_UPDATED, {
      userId,
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    })
    
    return updatedProfile
  }

  /**
   * Register event handlers
   */
  registerEventHandlers(): void {
    // Handle user registration events
    this.eventEmitter.on(EventType.USER_REGISTERED, async (data) => {
      logger.info({ userId: data.userId }, 'Processing user registration event')
      
      try {
        // Get user data from Clerk
        const user = await this.clerkCircuitBreaker.execute(() => 
          this.clerkClient.users.getUser(data.userId)
        )
        
        // Initialize profile
        await this.profileRepository.initializeProfile(data.userId, {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          imageUrl: user.imageUrl
        })
        
        logger.info({ userId: data.userId }, 'User profile initialized successfully')
      } catch (error) {
        logger.error({ err: error, userId: data.userId }, 'Failed to initialize user profile')
      }
    })
  }

  /**
   * Update user roles in Clerk
   */
  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    try {
      // Get current user from Clerk
      const user = await this.clerkCircuitBreaker.execute(() => 
        this.clerkClient.users.getUser(userId)
      )
      
      // Update public metadata with roles
      await this.clerkCircuitBreaker.execute(() => 
        this.clerkClient.users.updateUser(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            roles
          }
        })
      )
      
      logger.info({ userId, roles }, 'User roles updated successfully')
    } catch (error) {
      logger.error({ err: error, userId, roles }, 'Failed to update user roles')
      throw error
    }
  }

  /**
   * Get user roles from Clerk
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      // Get user from Clerk
      const user = await this.clerkCircuitBreaker.execute(() => 
        this.clerkClient.users.getUser(userId)
      )
      
      // Extract roles from public metadata
      return (user.publicMetadata?.roles || []) as string[]
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get user roles')
      throw error
    }
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, role: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId)
    return roles.includes(role)
  }

  /**
   * Initialize a new user profile
   */
  async initializeNewUser(
    userId: string, 
    userData: { 
      firstName?: string,
      lastName?: string,
      username?: string,
      imageUrl?: string
    }
  ): Promise<UserProfileModel> {
    // Check if profile already exists
    try {
      const existingProfile = await this.profileRepository.getProfileByUserId(userId)
      if (existingProfile) {
        return existingProfile
      }
    } catch (error) {
      // Profile doesn't exist, which is expected here
    }
    
    // Create new profile
    const profile = await this.profileRepository.initializeProfile(userId, userData)
    
    // Emit user registered event
    await this.eventEmitter.emit(EventType.USER_REGISTERED, {
      userId,
      username: userData.username || '',
      timestamp: new Date().toISOString()
    })
    
    return profile
  }
}
