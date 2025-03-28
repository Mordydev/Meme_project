import { Page } from '@playwright/test';

/**
 * Login helper for tests that require authentication
 * @param page Playwright page
 * @param email User email (defaults to test account)
 * @param password User password (defaults to test account)
 */
export async function loginUser(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'TestPassword123'
): Promise<void> {
  // Navigate to login page
  await page.goto('/sign-in');
  
  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete (either dashboard or some authenticated page)
  await page.waitForURL(/.*dashboard|.*home|.*profile/);
}

/**
 * Helper to create a test user
 * @param page Playwright page
 * @param userData User data for registration
 * @returns Created user's email and password
 */
export async function createTestUser(
  page: Page,
  userData?: {
    email?: string;
    password?: string;
    username?: string;
  }
): Promise<{ email: string; password: string }> {
  const timestamp = Date.now();
  const email = userData?.email || `test-${timestamp}@example.com`;
  const password = userData?.password || 'TestPassword123';
  const username = userData?.username || `testuser-${timestamp}`;
  
  // Navigate to registration page
  await page.goto('/sign-up');
  
  // Fill registration form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="username"]', username);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for registration to complete
  await page.waitForURL(/.*dashboard|.*onboarding/);
  
  return { email, password };
}