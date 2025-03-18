import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for handling user authentication state and actions
 * 
 * @returns Authentication state and methods
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  // Simulate checking auth status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // In a real implementation, this would check for a stored token,
        // validate with backend, etc.
        const hasSession = localStorage.getItem('authToken');
        
        if (hasSession) {
          // Mock user data for now
          setUser({
            id: '123',
            username: 'user123',
            level: 1
          });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      // This would make an API call in production
      console.log('Logging in with:', credentials);
      
      // Mock successful login
      localStorage.setItem('authToken', 'mock_token');
      
      setUser({
        id: '123',
        username: credentials.email.split('@')[0],
        level: 1
      });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // This would make an API call in production
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: 'Logout failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    isLoaded: !isLoading,        // Add isLoaded alias for !isLoading
    isSignedIn: isAuthenticated, // Add isSignedIn alias for isAuthenticated
    user,
    login,
    logout
  };
}

export default useAuth;
