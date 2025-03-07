import { FastifyInstance } from 'fastify'
import { join } from 'path'
import { build as buildApp } from '../src/app'

/**
 * Build Fastify instance for testing
 */
export async function build(): Promise<FastifyInstance> {
  const app = await buildApp({
    logger: false,
    trustProxy: true,
  })

  return app
}

/**
 * Create a test user for authentication
 */
export async function createTestUser() {
  // This would typically create a user in your test database
  // For now, we'll just return a mock user
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  }
}

/**
 * Get a test authentication token
 */
export function getTestToken() {
  // This would typically generate a real JWT
  // For now, we'll just return a mock token
  return 'test-token'
}

/**
 * Clear the test database
 */
export async function clearTestDatabase() {
  // This would typically clear your test database tables
  // For now, we'll just return a mock
  return true
}
