import { test, expect } from '@playwright/test';
import { loginUser } from '../utils/auth-helper';

test.describe('Points System', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });
  
  test('should display user points on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check points section is visible
    await expect(page.locator('.points-display')).toBeVisible();
    
    // Check specific elements
    await expect(page.locator('.current-points')).toBeVisible();
    await expect(page.locator('.points-history-link')).toBeVisible();
  });
  
  test('should earn points for creating content', async ({ page }) => {
    // Get initial points
    await page.goto('/dashboard');
    const initialPointsEl = page.locator('.current-points');
    await initialPointsEl.waitFor({ state: 'visible' });
    const initialPointsText = await initialPointsEl.textContent() || '0';
    const initialPoints = parseInt(initialPointsText.replace(/[^0-9]/g, ''), 10);
    
    // Create a post to earn points
    await page.goto('/community/create');
    await page.fill('input[name="title"]', `Point Test ${Date.now()}`);
    await page.fill('textarea[name="content"]', 'Testing point earning');
    await page.selectOption('select[name="category"]', 'general');
    await page.click('button[type="submit"]');
    
    // Verify post was created
    await expect(page).toHaveURL(/.*community\/post\/.+/);
    
    // Go back to dashboard to check points
    await page.goto('/dashboard');
    const updatedPointsEl = page.locator('.current-points');
    await updatedPointsEl.waitFor({ state: 'visible' });
    const updatedPointsText = await updatedPointsEl.textContent() || '0';
    const updatedPoints = parseInt(updatedPointsText.replace(/[^0-9]/g, ''), 10);
    
    // Check points increased
    expect(updatedPoints).toBeGreaterThan(initialPoints);
  });
  
  test('should show points history', async ({ page }) => {
    await page.goto('/points/history');
    
    // Check points history table is displayed
    await expect(page.locator('table.points-history')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Source")')).toBeVisible();
    
    // Check at least one transaction is displayed
    await expect(page.locator('tbody tr')).toHaveCount({ min: 1 });
  });
});