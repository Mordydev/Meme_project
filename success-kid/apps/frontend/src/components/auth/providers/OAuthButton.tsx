'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { OAuthStrategy, useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface OAuthButtonProps {
  provider: OAuthStrategy;
  label: string;
  icon: React.ReactNode;
  mode: 'sign-in' | 'sign-up';
  className?: string;
}

/**
 * OAuth provider button that works with Clerk
 */
export function OAuthButton({
  provider,
  label,
  icon,
  mode,
  className = ''
}: OAuthButtonProps) {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();
  
  const handleClick = useCallback(async () => {
    try {
      if (mode === 'sign-in' && signIn) {
        const result = await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/'
        });
      } else if (mode === 'sign-up' && signUp) {
        const result = await signUp.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/onboarding'
        });
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    }
  }, [provider, signIn, signUp, mode, router]);
  
  const isLoaded = mode === 'sign-in' ? isSignInLoaded : isSignUpLoaded;
  
  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={handleClick}
      disabled={!isLoaded}
    >
      {icon}
      <span>{isLoaded ? label : 'Loading...'}</span>
    </Button>
  );
}
