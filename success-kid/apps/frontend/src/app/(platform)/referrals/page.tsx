'use client';

import { useEffect } from 'react';
import { ReferralCodeDisplay, SocialSharing, ReferralDashboard, ReferralsList, CampaignSelector, QRCodeGenerator } from '@/components/features/referrals';
import { useReferralData } from '@/hooks';

export default function ReferralsPage() {
  const { 
    referralCode, 
    referralLink, 
    isLoading, 
    statistics,
    regenerateCode,
    copyReferralLink
  } = useReferralData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Referral Program</h1>
      
      <div className="mb-6">
        <p className="text-lg text-gray-700">
          Invite your friends to join Success Kid Community and earn rewards when they sign up and engage with the platform.
        </p>
      </div>
      
      {/* Referral Code and Social Sharing Section */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <ReferralCodeDisplay 
          referralCode={referralCode}
          referralLink={referralLink}
          onRegenerateCode={regenerateCode}
          isLoading={isLoading}
        />
        
        <SocialSharing 
          referralLink={referralLink}
          defaultMessage="Join me on the Success Kid Community Platform! Sign up with my referral link to get bonus points:"
        />
      </div>
      
      {/* QR Code Generator Section */}
      <div className="mb-8">
        <QRCodeGenerator referralLink={referralLink} />
      </div>
      
      {/* Referral Dashboard Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Referral Performance</h2>
        <ReferralDashboard />
      </div>
      
      {/* Referrals List Section */}
      <div className="mb-8">
        <ReferralsList />
      </div>
      
      {/* Campaigns Section */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Special Campaigns</h2>
        <CampaignSelector />
      </div>
    </div>
  );
}
