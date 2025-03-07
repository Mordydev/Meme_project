/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a username
 */
export function isValidUsername(username: string): boolean {
  // Allow letters, numbers, underscores, hyphens, minimum 3 chars, maximum 30
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate a password
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, must include at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate a Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are 44 characters, base58 encoded
  // This is a simple validation, in practice a more thorough check would be needed
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
  return solanaAddressRegex.test(address);
}

/**
 * Check if a string is empty or whitespace only
 */
export function isEmptyString(str: string): boolean {
  return str.trim().length === 0;
}

/**
 * Validate a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
