import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill signup form
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Test@123456');
    await page.fill('input[name="username"]', `user-${Date.now()}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert successful registration
    await expect(page).toHaveURL(/.*dashboard/);
  });
  
  test('should allow user to sign in', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill login form
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'Password@123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });
  
  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText(/invalid/i);
  });
});