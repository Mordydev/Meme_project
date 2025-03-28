/**
 * Test Mocking Utilities
 * 
 * Helper functions for creating test mocks.
 */
import { jest } from '@jest/globals';
import { MockRepositoryFactory } from '../mocks';

/**
 * Create a mock function with typed return value
 * 
 * @param returnValue Value to return from mock
 * @returns Mocked function
 */
export function createMockFn<T>(returnValue: T): jest.Mock<any, any, T> {
  return jest.fn().mockReturnValue(returnValue);
}

/**
 * Create a mock function that returns a Promise
 * 
 * @param returnValue Value to resolve Promise with
 * @returns Mocked function returning a Promise
 */
export function createMockAsyncFn<T>(returnValue: T): jest.Mock<any, any, Promise<T>> {
  return jest.fn().mockResolvedValue(returnValue);
}

/**
 * Create a mock function that returns different values on each call
 * 
 * @param returnValues Values to return in sequence
 * @returns Mocked function
 */
export function createMockFnWithValues<T>(...returnValues: T[]): jest.Mock<any, any, T> {
  const mock = jest.fn();
  returnValues.forEach(value => {
    mock.mockReturnValueOnce(value);
  });
  return mock;
}

/**
 * Create a mock function that rejects with an error
 * 
 * @param error Error to reject with
 * @returns Mocked function returning a rejected Promise
 */
export function createMockRejectedFn(error: Error): jest.Mock<any, any, Promise<never>> {
  return jest.fn().mockRejectedValue(error);
}

/**
 * Create a mocked version of a class
 * 
 * @param methods Methods to mock
 * @returns Mocked class instance
 */
export function createMockClass<T>(methods: Partial<T>): jest.Mocked<T> {
  return methods as jest.Mocked<T>;
}

/**
 * Create mocked repositories for a service
 * 
 * @returns Object containing mocked repositories
 */
export function createMockedRepositories() {
  return {
    userRepository: MockRepositoryFactory.createUserRepository(),
    pointsRepository: MockRepositoryFactory.createPointsRepository(),
    contentRepository: MockRepositoryFactory.createContentRepository(),
    walletRepository: MockRepositoryFactory.createWalletRepository()
  };
}

/**
 * Create mocked event emitter
 * 
 * @returns Mocked event emitter
 */
export function createMockEventEmitter() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
  };
}

/**
 * Create a mocked request object
 * 
 * @param overrides Properties to override
 * @returns Mocked request object
 */
export function createMockRequest(overrides: any = {}) {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: null,
    ...overrides
  };
}

/**
 * Create a mocked reply object
 * 
 * @returns Mocked reply object
 */
export function createMockReply() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let payload: any = null;
  
  const reply = {
    code: jest.fn().mockImplementation((code: number) => {
      statusCode = code;
      return reply;
    }),
    header: jest.fn().mockImplementation((name: string, value: string) => {
      headers.set(name, value);
      return reply;
    }),
    send: jest.fn().mockImplementation((data: any) => {
      payload = data;
      return reply;
    }),
    statusCode,
    getPayload: () => payload,
    getHeaders: () => Object.fromEntries(headers)
  };
  
  return reply;
}

export default {
  createMockFn,
  createMockAsyncFn,
  createMockFnWithValues,
  createMockRejectedFn,
  createMockClass,
  createMockedRepositories,
  createMockEventEmitter,
  createMockRequest,
  createMockReply
};
