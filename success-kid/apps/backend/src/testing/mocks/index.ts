/**
 * Mock Implementations
 * 
 * Registry of mock implementations for various services and dependencies.
 */
import { jest } from '@jest/globals';

// Define the MockService interface
export interface MockService<T> {
  register(name: string, implementation: Partial<T>): void;
  get(name: string): T;
  reset(): void;
  restore(): void;
}

/**
 * Creates a mock service for the specified type
 * 
 * @param defaultImplementation Default implementation to use when no specific mock is found
 * @returns A mock service instance
 */
export function createMockService<T>(defaultImplementation: Partial<T> = {}): MockService<T> {
  const implementations = new Map<string, Partial<T>>();
  
  return {
    /**
     * Register a mock implementation with a specific name
     * 
     * @param name Name of the mock implementation
     * @param implementation Mock implementation
     */
    register(name: string, implementation: Partial<T>): void {
      implementations.set(name, implementation);
    },
    
    /**
     * Get a mock implementation by name
     * 
     * @param name Name of the mock implementation to retrieve
     * @returns The mock implementation
     */
    get(name: string): T {
      const implementation = implementations.get(name) || defaultImplementation;
      return implementation as T;
    },
    
    /**
     * Reset all mock implementations
     */
    reset(): void {
      implementations.clear();
    },
    
    /**
     * Restore original implementations (stub for compatibility with other mocking libraries)
     */
    restore(): void {
      implementations.clear();
    }
  };
}

/**
 * Creates a mock repository with common repository methods
 * 
 * @returns A mock repository with Jest mock functions
 */
export function createMockRepository() {
  return {
    findById: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}

/**
 * Creates a mock service with common service methods
 * 
 * @returns A mock service with Jest mock functions
 */
export function createMockService() {
  return {
    initialize: jest.fn(),
    shutdown: jest.fn(),
  };
}

/**
 * Mock repository factory for creating consistent repository mocks
 */
export const MockRepositoryFactory = {
  /**
   * Creates a mock user repository
   * 
   * @returns A mocked user repository
   */
  createUserRepository: () => ({
    ...createMockRepository(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    updateProfile: jest.fn(),
  }),
  
  /**
   * Creates a mock points repository
   * 
   * @returns A mocked points repository
   */
  createPointsRepository: () => ({
    ...createMockRepository(),
    getUserPointsTotal: jest.fn(),
    getDailyPointsBySource: jest.fn(),
    addPointsTransaction: jest.fn(),
    getUserTransactions: jest.fn(),
  }),
  
  /**
   * Creates a mock content repository
   * 
   * @returns A mocked content repository
   */
  createContentRepository: () => ({
    ...createMockRepository(),
    findByUserId: jest.fn(),
    findFeatured: jest.fn(),
    searchContent: jest.fn(),
    addComment: jest.fn(),
    getComments: jest.fn(),
  }),
  
  /**
   * Creates a mock wallet repository
   * 
   * @returns A mocked wallet repository
   */
  createWalletRepository: () => ({
    ...createMockRepository(),
    findByUserId: jest.fn(),
    findByAddress: jest.fn(),
    saveConnection: jest.fn(),
    verifyConnection: jest.fn(),
  }),
};

export default {
  createMockService,
  createMockRepository,
  MockRepositoryFactory,
};
