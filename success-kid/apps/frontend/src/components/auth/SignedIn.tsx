'use client';

import { useAuth } from '@/hooks/useAuth';

/**
 * Component that renders its children only if the user is signed in
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded || !isSignedIn) {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * Component that renders its children only if the user is signed out
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded || isSignedIn) {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * Component that renders its children only if the user has a specific role
 */
export function HasRole({ 
  children, 
  role 
}: { 
  children: React.ReactNode; 
  role: string | string[];
}) {
  const { isLoaded, isSignedIn, user } = useAuth();
  
  if (!isLoaded || !isSignedIn || !user) {
    return null;
  }
  
  const userRole = user.publicMetadata?.role as string;
  
  if (!userRole) {
    return null;
  }
  
  const hasRole = Array.isArray(role) 
    ? role.includes(userRole)
    : userRole === role;
    
  if (!hasRole) {
    return null;
  }
  
  return <>{children}</>;
}
