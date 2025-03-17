/**
 * Clerk Authentication Provider for React
 * 
 * Provides authentication state and functions for the Success Kid Community Platform
 * using Clerk as the authentication service.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../api-client';
import { UserProfile } from '@success-kid/api-types';
import { websocketClient } from '../../websocket-client';

/**
 * Authentication context interface
 */
interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  user: UserProfile | null;
  token: string | null;
  signIn: (redirectUrl?: string) => void;
  signUp: (redirectUrl?: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Internal authentication provider component that uses Clerk hooks
 */
function InnerAuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Effect to fetch and set JWT token when auth state changes
  useEffect(() => {
    const fetchToken = async () => {
      if (isLoaded) {
        if (isSignedIn && clerkUser) {
          try {
            // Get token from Clerk
            const jwt = await getToken();
            setToken(jwt);
            
            // Store token in localStorage for API client
            if (jwt) {
              localStorage.setItem('auth_token', jwt);
              
              // Connect WebSocket with new token
              websocketClient.connect(jwt);
              
              // Fetch user profile from our API
              await refreshUserProfile(jwt);
            }
          } catch (error) {
            console.error('Error fetching auth token:', error);
          }
        } else {
          // Clear token and user when signed out
          setToken(null);
          setUser(null);
          localStorage.removeItem('auth_token');
          
          // Disconnect WebSocket
          websocketClient.disconnect();
        }
        
        setIsLoading(false);
      }
    };
    
    fetchToken();
  }, [isLoaded, isSignedIn, clerkUser, getToken]);
  
  /**
   * Refresh user profile from API
   */
  const refreshUserProfile = async (currentToken: string | null = token) => {
    if (!currentToken) return;
    
    try {
      const response = await apiClient.get<UserProfile>('/api/v1/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  /**
   * Sign in redirect
   */
  const signIn = (redirectUrl?: string) => {
    router.push(redirectUrl || '/sign-in');
  };
  
  /**
   * Sign up redirect
   */
  const signUp = (redirectUrl?: string) => {
    router.push(redirectUrl || '/sign-up');
  };
  
  /**
   * Sign out and cleanup
   */
  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    websocketClient.disconnect();
    router.push('/');
  };
  
  // Provide auth context to children
  return (
    <AuthContext.Provider value={{
      isLoading,
      isSignedIn: !!user,
      user,
      token,
      signIn,
      signUp,
      signOut,
      refreshProfile: refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Main authentication provider that wraps with Clerk provider
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''}
      appearance={{
        variables: {
          colorPrimary: '#1E88E5', // Match Success Kid primary color
          colorBackground: '#ffffff',
          colorText: '#212121',
          fontFamily: 'Inter, sans-serif'
        }
      }}
    >
      <InnerAuthProvider>
        {children}
      </InnerAuthProvider>
    </ClerkProvider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
