/**
 * Custom Validators
 * 
 * Provides custom Zod validators and validation utilities for domain-specific rules
 */
import { z } from 'zod';
import { logger } from '../lib/logger';

/**
 * Custom validator for Solana wallet addresses
 */
export const solanaAddressValidator = z.string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana wallet address format');

/**
 * Custom validator for Ethereum wallet addresses
 */
export const ethereumAddressValidator = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address format');

/**
 * Validate wallet address based on wallet type
 */
export function walletAddressValidator(walletType: string = 'phantom'): z.ZodType<string> {
  if (walletType === 'phantom' || walletType === 'solana') {
    return solanaAddressValidator;
  } else if (walletType === 'metamask' || walletType === 'ethereum') {
    return ethereumAddressValidator;
  }
  
  // Generic fallback
  return z.string()
    .min(20, 'Wallet address too short')
    .max(255, 'Wallet address too long');
}

/**
 * Validator for valid URLs with specific allowed protocols
 */
export const urlValidator = z.string()
  .url()
  .refine(
    url => url.startsWith('http://') || url.startsWith('https://'),
    { message: 'URL must use http or https protocol' }
  );

/**
 * Username validator - alphanumeric with underscores and hyphens
 */
export const usernameValidator = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    username => !username.startsWith('admin'),
    { message: 'Username cannot start with "admin"' }
  );

/**
 * Referral code validator
 */
export const referralCodeValidator = z.string()
  .min(6, 'Referral code must be at least 6 characters')
  .max(20, 'Referral code cannot exceed 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Referral code can only contain letters, numbers, underscores, and hyphens');

/**
 * Password strength validator
 */
export const passwordValidator = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Future date validator - ensures a date is in the future
 */
export const futureDateValidator = z.coerce.date()
  .refine(
    date => date > new Date(),
    { message: 'Date must be in the future' }
  );

/**
 * Past date validator - ensures a date is in the past
 */
export const pastDateValidator = z.coerce.date()
  .refine(
    date => date < new Date(),
    { message: 'Date must be in the past' }
  );

/**
 * Date range validator - validates start and end dates
 */
export function dateRangeValidator(startDateField: string, endDateField: string) {
  return z.object({
    [startDateField]: z.coerce.date(),
    [endDateField]: z.coerce.date()
  }).refine(
    data => data[startDateField] < data[endDateField],
    {
      message: `${startDateField} must be before ${endDateField}`,
      path: [endDateField]
    }
  );
}

/**
 * Positive integer validator
 */
export const positiveIntegerValidator = z.number()
  .int('Value must be an integer')
  .positive('Value must be positive');

/**
 * Non-negative integer validator
 */
export const nonNegativeIntegerValidator = z.number()
  .int('Value must be an integer')
  .nonnegative('Value must be non-negative');

/**
 * Constrained number range validator
 */
export function numberRangeValidator(min: number, max: number) {
  return z.number()
    .min(min, `Value must be at least ${min}`)
    .max(max, `Value cannot exceed ${max}`);
}

/**
 * File size validator (in bytes)
 */
export function fileSizeValidator(maxSizeBytes: number) {
  return z.number()
    .int()
    .positive()
    .max(maxSizeBytes, `File size cannot exceed ${maxSizeBytes / 1024 / 1024} MB`);
}

/**
 * Image dimensions validator
 */
export function imageDimensionsValidator(minWidth: number, minHeight: number, maxWidth: number, maxHeight: number) {
  return z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  }).refine(
    dimensions => dimensions.width >= minWidth && dimensions.height >= minHeight,
    { message: `Image dimensions must be at least ${minWidth}x${minHeight} pixels` }
  ).refine(
    dimensions => dimensions.width <= maxWidth && dimensions.height <= maxHeight,
    { message: `Image dimensions cannot exceed ${maxWidth}x${maxHeight} pixels` }
  );
}

/**
 * Validate a value is one of an allowed set
 */
export function allowedValuesValidator<T>(allowedValues: T[], errorMessage?: string) {
  return z.any().refine(
    value => allowedValues.includes(value as T),
    { message: errorMessage || `Value must be one of: ${allowedValues.join(', ')}` }
  );
}

/**
 * Check if a value matches a complex pattern
 */
export function patternValidator(pattern: RegExp, errorMessage: string) {
  return z.string().regex(pattern, errorMessage);
}
