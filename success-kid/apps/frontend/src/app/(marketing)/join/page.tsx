'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReferralLanding } from '@/components/features/referral';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Landing page for referred users
 */
export default function JoinPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [referralInfo, setReferralInfo] = useState<{
    referralCode?: string;
    referrerId?: string;
  } | null>(null);
  
  // Handle when user clicks register from referral landing
  const handleRegister = (data: { referralCode: string; referrerId: string }) => {
    setReferralInfo(data);
    // In a real implementation, we would:
    // 1. Store this information for use during registration
    // 2. Navigate to registration form or open registration modal
    
    // For now, we'll just log it and offer a button to registration
    console.log('Registration with referral:', data);
  };
  
  // If already signed in, show different message
  if (isLoaded && isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">You're already a member!</h1>
        <p className="text-lg mb-8">
          You're already part of the Success Kid community. 
          Why not invite some friends to join you?
        </p>
        <Link href="/referrals" passHref>
          <Button>Start Referring</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Referral-specific landing component */}
        <ReferralLanding 
          onRegister={handleRegister}
          className="mb-8"
        />
        
        {/* General landing content */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Join the Success Kid Community</h1>
          <p className="text-xl text-neutral-700 mb-6">
            Connect with crypto enthusiasts, earn rewards for your participation, 
            and become part of a growing community
          </p>
        </div>
        
        {/* Registration button that would use the referral info */}
        <div className="flex justify-center mb-12">
          <Button size="lg" className="px-8 py-6 text-lg">
            Create Your Account
          </Button>
        </div>
        
        {/* Benefits section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-primary-50 p-6 rounded-lg">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
            <p>Get Success Points for every contribution and redeem them for tokens</p>
          </div>
          
          <div className="bg-primary-50 p-6 rounded-lg">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-xl font-semibold mb-2">Build Community</h3>
            <p>Connect with like-minded people and grow together</p>
          </div>
          
          <div className="bg-primary-50 p-6 rounded-lg">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="text-xl font-semibold mb-2">Watch It Grow</h3>
            <p>Be part of something special from the beginning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
