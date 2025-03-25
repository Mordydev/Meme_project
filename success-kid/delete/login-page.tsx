'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect to the dashboard or saved redirect path
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('Login page: User already authenticated, redirecting');
      
      // Check if there's a stored redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        console.log('Login page: Redirecting to stored path:', redirectPath);
        sessionStorage.removeItem('redirectAfterLogin'); // Clear it to prevent future redirects
        router.push(redirectPath);
      } else {
        console.log('Login page: No stored redirect path, going to dashboard');
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-gray-500">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the Clerk SignIn component
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <SignIn 
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg rounded-lg',
            }
          }}
        />
      </div>
    );
  }

  // If authenticated but still on this page (while redirect is processing)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-gray-500">You're logged in! Redirecting...</p>
      </div>
    </div>
  );
}
