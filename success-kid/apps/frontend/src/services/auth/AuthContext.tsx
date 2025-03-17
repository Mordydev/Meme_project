'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  ClerkProvider, 
  SignedIn, 
  SignedOut, 
  useUser, 
  useAuth 
} from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

/**
 * Auth context properties
 */
interface AuthContextProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Current user data */
  user: {
    id: string;
    email: string;
    displayName: string;
    profileImageUrl: string;
  } | null;
  /** Sign out function */
  signOut: () => Promise<void>;
  /** JWT token for API requests */
  getToken: () => Promise<string | null>;
}

// Create context
const AuthContext = createContext<AuthContextProps | null>(null);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Inner auth provider that uses Clerk hooks
 * This component must be within ClerkProvider to access Clerk hooks
 */
function AuthContextProvider({ children }: AuthProviderProps) {
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const router = useRouter();
  
  // Combined loading state from Clerk
  const isLoading = !isUserLoaded || !isAuthLoaded;
  
  // Simplified auth state
  const isAuthenticated = isUserLoaded && !!clerkUser;
  
  // Parsed user data
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    displayName: clerkUser.firstName 
      ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
      : clerkUser.username || '',
    profileImageUrl: clerkUser.imageUrl,
  } : null;
  
  // Sign out function that redirects to home
  const signOut = async () => {
    try {
      // Use Clerk signOut
      await window.Clerk.signOut();
      // Navigate to home page after signout
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Update token in local storage when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      getToken().then(token => {
        if (token) {
          localStorage.setItem('auth_token', token);
        }
      });
    } else if (!isLoading) {
      localStorage.removeItem('auth_token');
    }
  }, [isAuthenticated, isLoading, getToken]);
  
  const value: AuthContextProps = {
    isAuthenticated,
    isLoading,
    user,
    signOut,
    getToken,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Main auth provider with Clerk
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary-600 text-white',
          footerActionLink: 'text-primary hover:text-primary-600',
        },
      }}
    >
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </ClerkProvider>
  );
}

/**
 * Hook to use auth context
 */
export function useAppAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAppAuth must be used within AuthProvider');
  }
  
  return context;
}

/**
 * Component that only renders content when user is signed in
 */
export function AuthenticatedOnly({ children }: { children: React.ReactNode }) {
  return <SignedIn>{children}</SignedIn>;
}

/**
 * Component that only renders content when user is signed out
 */
export function UnauthenticatedOnly({ children }: { children: React.ReactNode }) {
  return <SignedOut>{children}</SignedOut>;
}
