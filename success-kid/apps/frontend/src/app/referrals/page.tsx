'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReferralPage } from '@/components/features/referral';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Main referrals page route
 */
export default function ReferralsRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Redirect if not signed in
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-6">You need to sign in to access the referral program</h1>
        <a 
          href="/login" 
          className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-600 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }
  
  // Render referral page if signed in
  return <ReferralPage />;
}
