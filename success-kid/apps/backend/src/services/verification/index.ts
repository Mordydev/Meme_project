/**
 * Verification Services
 * 
 * Exports all verification-related services
 */

// Re-export all verification services and types
export * from './token-service';
export * from './email-service';
export * from './password-reset-service';
export * from './account-recovery-service';

// Import repositories for initialization
import { UserRepository } from '../../repositories/user-repository';
import { EmailVerificationService, emailVerificationService } from './email-service';
import { PasswordResetService, passwordResetService } from './password-reset-service';
import { AccountRecoveryService, accountRecoveryService } from './account-recovery-service';

/**
 * Initialize all verification services with dependencies
 */
export function initializeVerificationServices(userRepository: UserRepository): void {
  // Initialize email verification service
  Object.assign(emailVerificationService, new EmailVerificationService(userRepository));
  
  // Initialize password reset service
  Object.assign(passwordResetService, new PasswordResetService(userRepository));
  
  // Initialize account recovery service
  Object.assign(accountRecoveryService, new AccountRecoveryService(userRepository));
}
