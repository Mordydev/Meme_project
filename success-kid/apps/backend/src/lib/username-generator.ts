/**
 * Username Generator
 * 
 * Utilities for generating and validating usernames
 */
import { randomBytes } from 'crypto';
import { userRepository, profileRepository } from '../repositories';
import { logger } from './logger';

// Adjectives for username generation
const ADJECTIVES = [
  'brave', 'mighty', 'swift', 'clever', 'bright',
  'bold', 'wise', 'calm', 'noble', 'great',
  'epic', 'awesome', 'cosmic', 'super', 'mega'
];

// Nouns for username generation
const NOUNS = [
  'warrior', 'wizard', 'hero', 'titan', 'champion',
  'legend', 'master', 'chief', 'king', 'pioneer',
  'explorer', 'captain', 'ranger', 'rocket', 'star'
];

// Adjectives specifically for wallet usernames
const WALLET_ADJECTIVES = [
  'crypto', 'digital', 'token', 'block', 'chain',
  'coin', 'wallet', 'nft', 'defi', 'web3',
  'pixel', 'moon', 'hodl', 'based', 'mint'
];

/**
 * Generate a random username
 * 
 * @param base Optional base string to include in the username
 * @param retry Number of retries if username is taken
 * @returns A unique username
 */
export async function generateUsername(
  base?: string,
  retry: number = 0
): Promise<string> {
  try {
    if (retry > 10) {
      // If we've tried too many times, just generate a truly random username
      const randomSuffix = randomBytes(4).toString('hex');
      return `user_${randomSuffix}`;
    }
    
    let username: string;
    
    if (base) {
      // If a base is provided, use it with a random number if needed
      if (retry > 0) {
        const randomSuffix = Math.floor(Math.random() * 9999);
        username = `${base}_${randomSuffix}`;
      } else {
        username = base;
      }
    } else {
      // Generate a random username with adjective + noun + number
      const isWalletUser = Math.random() > 0.5;
      const adjectives = isWalletUser ? WALLET_ADJECTIVES : ADJECTIVES;
      
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const number = Math.floor(Math.random() * 999) + 1;
      
      username = `${adjective}_${noun}${number}`;
    }
    
    // Check if username is already taken
    const existingProfile = await profileRepository.findByUsername(username);
    
    if (existingProfile) {
      // Username is taken, retry with a different one
      return generateUsername(base, retry + 1);
    }
    
    return username;
  } catch (error) {
    logger.error('Error generating username', { error, base, retry });
    
    // Fallback to a safe, random username
    const randomSuffix = randomBytes(4).toString('hex');
    return `user_${randomSuffix}`;
  }
}

/**
 * Check if a username is valid
 * 
 * @param username Username to check
 * @returns Whether the username is valid
 */
export function isValidUsername(username: string): boolean {
  // Username requirements:
  // - 3-20 characters
  // - Only alphanumeric characters, underscores, and hyphens
  // - Must start with a letter
  // - No consecutive underscores or hyphens
  
  // Check length
  if (username.length < 3 || username.length > 20) {
    return false;
  }
  
  // Check if starts with a letter
  if (!/^[a-zA-Z]/.test(username)) {
    return false;
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return false;
  }
  
  // Check for consecutive underscores or hyphens
  if (/[_-]{2,}/.test(username)) {
    return false;
  }
  
  return true;
}
