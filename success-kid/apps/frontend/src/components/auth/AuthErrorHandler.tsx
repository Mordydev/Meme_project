'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Provides global error handling for authentication failures
 */
export function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  // Intercept fetch for API requests to detect auth errors
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init);
        
        // Check if response status indicates auth error
        if (response.status === 401) {
          // Only show error if user should be signed in
          if (isSignedIn) {
            setError('Your session has expired. Please sign in again.');
          }
        }
        
        return response;
      } catch (error) {
        // Handle network errors
        console.error('Fetch error:', error);
        throw error;
      }
    };
    
    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, [isSignedIn]);
  
  // Handle recovery actions
  const handleSignIn = () => {
    setIsRecovering(true);
    router.push('/sign-in');
  };
  
  const handleDismiss = () => {
    setError(null);
  };
  
  // Only show children once auth is loaded
  if (!isLoaded) {
    return null;
  }
  
  return (
    <>
      {children}
      
      {/* Error notification */}
      <AnimatePresence>
        {error && !isRecovering && (
          <motion.div
            className="fixed bottom-4 right-4 bg-white border border-red-200 shadow-lg rounded-lg p-4 w-96 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="ml-3 w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900">Authentication Error</h3>
                <div className="mt-1 text-sm text-gray-500">
                  {error}
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button 
                    size="sm"
                    onClick={handleSignIn}
                  >
                    Sign in
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleDismiss}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
