/**
 * Authentication Components
 * 
 * This file exports all authentication-related components
 * for easy use throughout the application
 */

// Auth Guards and Protection
export { default as AuthGuard } from './AuthGuard';
export { SignedIn } from './SignedIn';

// Auth UI Components
export { WalletAuth } from './WalletAuth';
export { MobileAuth } from './MobileAuth';
export { MobileAuthStatus } from './MobileAuthStatus';
export { RecoveryForm } from './RecoveryForm';
export { DeviceManager } from './DeviceManager';

// Auth Utilities
export { AuthErrorHandler } from './AuthErrorHandler';
export { SessionRecovery } from './SessionRecovery';

// Types and Constants
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  WALLET = 'wallet',
}

export enum AuthErrorCode {
  UNAUTHORIZED = 'unauthorized',
  INVALID_CREDENTIALS = 'invalid_credentials',
  ACCOUNT_SUSPENDED = 'account_suspended',
  NETWORK_ERROR = 'network_error',
  SESSION_EXPIRED = 'session_expired',
  WALLET_ERROR = 'wallet_error',
  WALLET_CONNECTION_FAILED = 'wallet_connection_failed',
  WALLET_SIGNATURE_FAILED = 'wallet_signature_failed',
  WALLET_VERIFICATION_FAILED = 'wallet_verification_failed',
  UNKNOWN = 'unknown',
}

// Usage Guide
/**
 * Authentication Components Usage Guide
 * 
 * 1. Protecting Routes:
 *    - Use <AuthGuard> to protect routes that require authentication
 *      Example: <AuthGuard><ProtectedPage /></AuthGuard>
 *    
 *    - Use requiredOnboarding prop to also verify onboarding completion
 *      Example: <AuthGuard requiredOnboarding={true}><DashboardPage /></AuthGuard>
 * 
 * 2. Conditional Rendering:
 *    - Use <SignedIn> to conditionally render content based on auth state
 *      Example: <SignedIn><UserProfile /></SignedIn>
 * 
 * 3. Authentication Status:
 *    - Use <MobileAuthStatus> for showing auth state on mobile devices
 *    - Shows user info when signed in, sign-in button when signed out
 * 
 * 4. Authentication Methods:
 *    - Use <MobileAuth> for the main authentication screen with multiple methods
 *    - Use <WalletAuth> for dedicated wallet authentication
 * 
 * 5. Account Recovery:
 *    - Use <RecoveryForm type="password-reset"> for password reset flow
 *    - Use <RecoveryForm type="account-recovery"> for account recovery
 * 
 * 6. Session Management:
 *    - Use <DeviceManager> to show and manage active sessions
 *    - Use <SessionRecovery> to attempt recovery of interrupted sessions
 * 
 * 7. Error Handling:
 *    - Use <AuthErrorHandler> to display and handle auth errors consistently
 */
