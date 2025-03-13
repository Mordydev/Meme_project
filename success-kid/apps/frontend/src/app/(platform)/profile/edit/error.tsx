'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function ProfileEditError({ error, reset }: ErrorProps) {
  const router = useRouter();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Profile edit error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-red-100 p-6 mb-6">
        <div className="text-red-500 text-5xl">⚠️</div>
      </div>
      <h2 className="text-2xl font-bold mb-3">Error editing profile</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We encountered an error while updating your profile. Please try again or cancel to return to your profile.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button onClick={() => router.push('/profile')} variant="outline">
          Return to Profile
        </Button>
      </div>
    </div>
  );
}
