'use client';

import { useState } from 'react';
import { useSignOut } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface SignOutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  redirectUrl?: string;
}

/**
 * Button component for signing out
 */
export function SignOutButton({
  variant = 'primary',
  size = 'md',
  className = '',
  redirectUrl = '/sign-in'
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useSignOut();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Call API to revoke session
      try {
        await fetch('/api/v1/auth/sessions', {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error revoking server session:', error);
        // Continue with sign out anyway
      }
      
      // Sign out from Clerk
      await signOut();
      
      // Redirect after sign out
      router.push(redirectUrl);
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      isLoading={isLoading}
      disabled={isLoading}
    >
      Sign Out
    </Button>
  );
}
