'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { ReferralCodeDisplay, SocialSharing, ReferralDashboard, ReferralsList } from '@/components/features/referrals';
import { useReferralData } from '@/hooks';

export default function ProfileReferralsPage() {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading } = useUserStore();
  const { 
    referralCode, 
    referralLink, 
    isLoading, 
    statistics,
    regenerateCode,
    copyReferralLink
  } = useReferralData();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isProfileLoading && !profile) {
      router.push('/auth/login');
    }
  }, [profile, isProfileLoading, router]);
  
  if (isProfileLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!profile) {
    return null; // Will redirect
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Referrals</h1>
        <p className="text-gray-600">
          Invite friends to join Success Kid Community and earn rewards
        </p>
      </div>
      
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <ReferralCodeDisplay 
          referralCode={referralCode}
          referralLink={referralLink}
          onRegenerateCode={regenerateCode}
          isLoading={isLoading}
        />
        
        <SocialSharing 
          referralLink={referralLink}
          defaultMessage={`I'm earning Success Points on the Success Kid platform! Join me using my referral link and get a bonus:`}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Referral Performance</h2>
        <ReferralDashboard />
      </div>
      
      <div>
        <h2 className="mb-4 text-2xl font-semibold">My Referrals</h2>
        <ReferralsList />
      </div>
    </div>
  );
}
