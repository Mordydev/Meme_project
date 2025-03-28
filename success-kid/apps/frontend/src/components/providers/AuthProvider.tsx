'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoaded, isSignedIn, user } = useClerkAuth();
  const [authState, setAuthState] = useState<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    if (isLoaded) {
      setAuthState({
        isAuthenticated: isSignedIn || false,
        isLoading: false,
        user: user
      });
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
