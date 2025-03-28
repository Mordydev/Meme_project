'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function ProfileError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Profile error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-red-100 p-6 mb-6">
        <div className="text-red-500 text-5xl">⚠️</div>
      </div>
      <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We encountered an error while loading the profile. Please try again or contact support if the problem persists.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          Go to Home
        </Button>
      </div>
    </div>
  );
}
