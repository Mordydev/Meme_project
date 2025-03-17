/**
 * Wallet Connection End-to-End Tests
 * 
 * Tests the wallet connection flows, including:
 * - Connecting a wallet
 * - Verifying wallet ownership
 * - Viewing wallet status
 * - Testing wallet-required features
 * 
 * Note: These tests require Phantom wallet browser extension to be installed
 * and may need to be run manually or with special setup for wallet interaction
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

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signIn(page);
  });
  
  test('should display wallet connection UI', async ({ page }) => {
    // Navigate to wallet page
    await page.goto('/wallet');
    
    // Check if wallet connection UI is displayed
    const connectWalletButton = page.locator('[data-testid="connect-wallet-button"]');
    const walletConnected = page.locator('[data-testid="wallet-connected"]');
    
    // Either the connect button or the connected state should be visible
    expect(await connectWalletButton.isVisible() || await walletConnected.isVisible()).toBeTruthy();
  });
  
  test('should show connect wallet prompt on token-related features', async ({ page }) => {
    // Navigate to points redemption page
    await page.goto('/points/redeem');
    
    // Check if wallet connection is required
    const walletRequired = await page.locator('text=Connect wallet to redeem points').isVisible();
    const walletConnected = await page.locator('[data-testid="redemption-form"]').isVisible();
    
    // Either we need to connect wallet or we're already connected
    expect(walletRequired || walletConnected).toBeTruthy();
    
    if (walletRequired) {
      // Test that the wallet connection button is shown
      await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
    }
  });
  
  // Note: The following tests require wallet interaction which is difficult to automate
  // They should be run manually or with special setup
  
  test.skip('should connect Phantom wallet', async ({ page }) => {
    // Navigate to wallet page
    await page.goto('/wallet');
    
    // Check if wallet is already connected
    if (await page.locator('[data-testid="wallet-connected"]').isVisible()) {
      // Click disconnect button
      await page.click('[data-testid="disconnect-wallet-button"]');
      await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
    }
    
    // Click connect wallet button
    await page.click('[data-testid="connect-wallet-button"]');
    
    // This would trigger Phantom popup, which is hard to automate
    // Assuming we can somehow approve the connection, check for success
    
    // Wait for wallet connected state
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
    
    // Should show wallet address
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible();
  });
  
  test.skip('should display wallet balance', async ({ page }) => {
    // Navigate to wallet page (assuming wallet is connected)
    await page.goto('/wallet');
    
    // Check if wallet balance is displayed
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    
    // Balance should be a number or "0" at minimum
    const balanceText = await page.locator('[data-testid="wallet-balance"]').textContent();
    expect(parseFloat(balanceText || '0')).toBeGreaterThanOrEqual(0);
  });
  
  test.skip('should verify wallet ownership', async ({ page }) => {
    // Navigate to wallet page (assuming wallet is connected)
    await page.goto('/wallet');
    
    // Check if verification is needed
    const verifyButton = page.locator('[data-testid="verify-wallet-button"]');
    
    if (await verifyButton.isVisible()) {
      // Click verify button
      await verifyButton.click();
      
      // This would trigger Phantom signature request, which is hard to automate
      // Assuming we can somehow approve the signature, check for success
      
      // Wait for verification success
      await expect(page.locator('text=Wallet verified successfully')).toBeVisible();
      
      // Should show verified status
      await expect(page.locator('[data-testid="wallet-verified"]')).toBeVisible();
    } else {
      // Check if already verified
      await expect(page.locator('[data-testid="wallet-verified"]')).toBeVisible();
    }
  });
});
