/**
 * Authentication utilities for the frontend
 */
import { auth } from '@clerk/nextjs';
import { User } from '@success-kid/api-types';

/**
 * Get the current auth token for API requests
 * @returns The JWT token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // When running in client components
    if (typeof window !== 'undefined') {
      // If using Clerk client-side, get token from there
      // This assumes a global auth object with getToken available
      // @ts-ignore - clerk global
      if (window.Clerk?.session) {
        // @ts-ignore - clerk global
        return await window.Clerk.session.getToken({ template: 'success-kid-api' });
      }
      
      // Fallback to session storage if available
      // (Not recommended for production - just a fallback)
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        return token;
      }
      
      return null;
    }
    
    // When running in server components
    const { getToken } = auth();
    const token = await getToken({ template: 'success-kid-api' });
    return token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 * @returns True if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Get the current user's ID
 * @returns The user ID or null if not authenticated
 */
export function getUserId(): string | null {
  try {
    // When running in server components
    const { userId } = auth();
    return userId;
  } catch (error) {
    // When running in client components or if auth() fails
    return null;
  }
}

/**
 * Store user information for local access
 * @param user User object to store
 */
export function storeUserInfo(user: User): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_info', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error storing user info:', error);
  }
}

/**
 * Get stored user information
 * @returns The stored user object or null if not available
 */
export function getStoredUserInfo(): User | null {
  try {
    if (typeof window !== 'undefined') {
      const userInfo = sessionStorage.getItem('user_info');
      if (userInfo) {
        return JSON.parse(userInfo);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting stored user info:', error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 * @param role Role or roles to check
 * @returns True if the user has the role
 */
export function hasRole(role: string | string[]): boolean {
  try {
    // Check in server components
    const { sessionClaims } = auth();
    const userRole = sessionClaims?.role as string;
    
    if (!userRole) return false;
    
    return Array.isArray(role) 
      ? role.includes(userRole)
      : userRole === role;
  } catch (error) {
    // Check in client components
    const userInfo = getStoredUserInfo();
    if (!userInfo) return false;
    
    // This assumes the user object has a role property
    // Adjust based on your actual user structure
    const userRole = (userInfo as any).role as string;
    
    if (!userRole) return false;
    
    return Array.isArray(role) 
      ? role.includes(userRole)
      : userRole === role;
  }
}
