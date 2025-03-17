'use client';

import { useEffect } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Handle OAuth callback redirects for both sign-in and sign-up flows
 */
export default function SSOCallbackPage() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Get query parameters
    const redirectUrl = searchParams?.get('redirect_url');
    
    // Make sure Clerk is loaded
    if (!isSignInLoaded || !isSignUpLoaded) {
      return;
    }
    
    // Process the OAuth callback for sign-in
    if (signIn?.status === 'needs_oauth_processing') {
      signIn.authenticateWithRedirect({
        redirectUrl: redirectUrl || window.location.href,
        redirectUrlComplete: redirectUrl || '/',
      });
      return;
    }
    
    // Process the OAuth callback for sign-up
    if (signUp?.status === 'needs_oauth_processing') {
      signUp.authenticateWithRedirect({
        redirectUrl: redirectUrl || window.location.href,
        redirectUrlComplete: redirectUrl || '/onboarding',
      });
      return;
    }
    
    // Handle successful authentication for sign-in
    if (signIn?.status === 'complete') {
      setActive({ session: signIn.createdSessionId });
      // Redirect based on whether this was sign up or sign in
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
      return;
    }
    
    // Handle successful authentication for sign-up
    if (signUp?.status === 'complete') {
      // For sign up we want to send them to onboarding
      router.push('/onboarding');
      return;
    }
    
    // If we reach here, something unusual happened - redirect home
    router.push('/');
  }, [isSignInLoaded, isSignUpLoaded, signIn, signUp, router, searchParams, setActive]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2">Completing Authentication...</h1>
        <p className="text-gray-600">Please wait while we finish authenticating your account.</p>
      </div>
    </div>
  );
}
