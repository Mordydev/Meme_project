import { test, expect } from '@playwright/test';
import { loginUser } from '../utils/auth-helper';

test.describe('Community Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });
  
  test('should display community forums', async ({ page }) => {
    await page.goto('/community');
    
    // Check forum categories are displayed
    await expect(page.locator('h2:has-text("General Discussion")')).toBeVisible();
    await expect(page.locator('h2:has-text("Token Talk")')).toBeVisible();
    await expect(page.locator('h2:has-text("Memes & Media")')).toBeVisible();
  });
  
  test('should allow creating a new post', async ({ page }) => {
    await page.goto('/community/create');
    
    // Fill post form
    await page.fill('input[name="title"]', `Test Post ${Date.now()}`);
    await page.fill('textarea[name="content"]', 'This is a test post created by Playwright');
    await page.selectOption('select[name="category"]', 'general');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert successful creation and redirect
    await expect(page).toHaveURL(/.*community\/post\/.+/);
    await expect(page.locator('h1')).toContainText(/Test Post/);
  });
  
  test('should allow commenting on posts', async ({ page }) => {
    // Go to an existing post
    await page.goto('/community/post/1');
    
    // Add a comment
    await page.fill('textarea[name="comment"]', 'This is a test comment');
    await page.click('button:has-text("Submit")');
    
    // Assert comment is displayed
    await expect(page.locator('.comment-content')).toContainText('This is a test comment');
  });
});