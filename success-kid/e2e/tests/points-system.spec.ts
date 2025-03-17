/**
 * Points System End-to-End Tests
 * 
 * Tests the critical points system flows, including:
 * - Points earning
 * - Points history viewing
 * - Points redemption
 */
import { test, expect } from '@playwright/test';

// Helper function to sign in
async function signIn(page) {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Points System', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signIn(page);
  });
  
  test('should display points balance', async ({ page }) => {
    // Navigate to profile or dashboard where points are displayed
    await page.goto('/dashboard');
    
    // Check if points balance is displayed
    await expect(page.locator('[data-testid="points-balance"]')).toBeVisible();
    
    // Points balance should be a number
    const pointsText = await page.locator('[data-testid="points-balance"]').textContent();
    expect(parseInt(pointsText || '0', 10)).toBeGreaterThanOrEqual(0);
  });
  
  test('should earn points for creating content', async ({ page }) => {
    // Get initial points balance
    await page.goto('/dashboard');
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText || '0', 10);
    
    // Navigate to content creation
    await page.click('[data-testid="create-content-button"]');
    
    // Create a post
    await page.fill('[data-testid="content-title"]', 'Test Post Title');
    await page.fill('[data-testid="content-body"]', 'This is a test post body');
    await page.click('[data-testid="submit-content"]');
    
    // Wait for success message
    await expect(page.locator('text=Content created successfully')).toBeVisible();
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Check if points increased
    const updatedPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const updatedPoints = parseInt(updatedPointsText || '0', 10);
    
    expect(updatedPoints).toBeGreaterThan(initialPoints);
  });
  
  test('should view points history', async ({ page }) => {
    // Navigate to points history page
    await page.goto('/points/history');
    
    // Verify that the page loads
    await expect(page.locator('h1')).toContainText('Points History');
    
    // Check if transactions are displayed
    await expect(page.locator('[data-testid="transaction-item"]').first()).toBeVisible();
    
    // Check transaction details
    const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
    await expect(firstTransaction.locator('[data-testid="transaction-amount"]')).toBeVisible();
    await expect(firstTransaction.locator('[data-testid="transaction-source"]')).toBeVisible();
    await expect(firstTransaction.locator('[data-testid="transaction-date"]')).toBeVisible();
  });
  
  test('should redeem points for tokens (if wallet connected)', async ({ page }) => {
    // Navigate to points redemption page
    await page.goto('/points/redeem');
    
    // Check if redemption form is available
    const redemptionForm = page.locator('[data-testid="redemption-form"]');
    
    if (await redemptionForm.isVisible()) {
      // Get initial points balance
      const initialPointsText = await page.locator('[data-testid="available-points"]').textContent();
      const initialPoints = parseInt(initialPointsText || '0', 10);
      
      // Check if user has enough points (at least 1000)
      if (initialPoints >= 1000) {
        // Enter redemption amount
        await page.fill('[data-testid="redemption-amount"]', '1000');
        
        // Submit redemption
        await page.click('[data-testid="redeem-button"]');
        
        // Wait for confirmation
        await expect(page.locator('text=Redemption successful')).toBeVisible();
        
        // Verify points were deducted
        const updatedPointsText = await page.locator('[data-testid="available-points"]').textContent();
        const updatedPoints = parseInt(updatedPointsText || '0', 10);
        
        expect(updatedPoints).toBe(initialPoints - 1000);
      } else {
        // Skip test if not enough points
        test.skip(true, 'Not enough points for redemption test');
      }
    } else {
      // Check if wallet connection is required
      const walletRequired = await page.locator('text=Connect wallet to redeem points').isVisible();
      
      if (walletRequired) {
        // Test that the wallet connection button is shown
        await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
      } else {
        // Some other issue, check for error message
        await expect(page.locator('[data-testid="redemption-error"]')).toBeVisible();
      }
    }
  });
  
  test('should enforce minimum redemption amount', async ({ page }) => {
    // Navigate to points redemption page
    await page.goto('/points/redeem');
    
    // Check if redemption form is available (assuming wallet is connected)
    const redemptionForm = page.locator('[data-testid="redemption-form"]');
    
    if (await redemptionForm.isVisible()) {
      // Enter too small redemption amount
      await page.fill('[data-testid="redemption-amount"]', '100');
      
      // Try to submit redemption
      await page.click('[data-testid="redeem-button"]');
      
      // Check for validation error
      await expect(page.locator('text=Minimum redemption amount is 1,000 points')).toBeVisible();
    } else {
      // Skip test if redemption form is not available
      test.skip(true, 'Redemption form not available');
    }
  });
});
