/**
 * Authentication End-to-End Tests
 * 
 * Tests the critical authentication flows, including:
 * - Sign in
 * - Sign up
 * - Protected routes
 * - Token persistence
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to sign-in when accessing a protected route', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });
  
  test('should successfully sign in with valid credentials', async ({ page }) => {
    // Go to sign-in page
    await page.goto('/sign-in');
    
    // Fill in credentials
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful sign-in
    await expect(page).toHaveURL('/dashboard');
    
    // User should be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('should show error message with invalid credentials', async ({ page }) => {
    // Go to sign-in page
    await page.goto('/sign-in');
    
    // Fill in invalid credentials
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.cl-auth-error-text')).toBeVisible();
    
    // Should not redirect to dashboard
    await expect(page).toHaveURL('/sign-in');
  });
  
  test('should successfully sign up with valid information', async ({ page }) => {
    // Go to sign-up page
    await page.goto('/sign-up');
    
    // Generate a unique email
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Fill in sign-up form
    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    
    // Click sign up button
    await page.click('button[type="submit"]');
    
    // Should verify email (may vary based on Clerk configuration)
    await expect(page.locator('text=Verify your email')).toBeVisible();
  });
  
  test('should persist authentication across page reloads', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Reload the page
    await page.reload();
    
    // Should still be on dashboard (not redirected to sign-in)
    await expect(page).toHaveURL('/dashboard');
    
    // User menu should still be visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('should successfully sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Open user menu and click sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="sign-out"]');
    
    // Should redirect to home page after sign out
    await expect(page).toHaveURL('/');
    
    // Attempt to access a protected route again
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
