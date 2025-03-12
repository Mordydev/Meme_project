import { currentUser, auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export async function getUser() {
  const user = await currentUser();
  return user;
}

/**
 * Require authentication for a route
 * Redirects to sign-in page if not authenticated
 * @returns The user ID if authenticated
 */
export async function requireAuth() {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }
  return userId;
}

/**
 * Check if the current user has a specific role
 * @param role The role to check for
 * @returns True if the user has the role, false otherwise
 */
export async function hasRole(role: string) {
  const { userId } = auth();
  if (!userId) return false;
  
  const user = await currentUser();
  if (!user) return false;
  
  return user.publicMetadata.role === role;
}

/**
 * Check if the current user is an admin
 * @returns True if the user is an admin, false otherwise
 */
export async function isAdmin() {
  return hasRole('admin');
}

/**
 * Create a type-safe user object with basic information
 * @param user The Clerk user object
 * @returns A simplified user object
 */
export function createSafeUser(user: any) {
  if (!user) return null;
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses?.[0]?.emailAddress,
    imageUrl: user.imageUrl,
    role: user.publicMetadata?.role || 'user',
  };
}
