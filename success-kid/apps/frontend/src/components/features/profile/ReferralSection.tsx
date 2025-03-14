'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReferralData } from '@/hooks';
import { ReferralCodeDisplay, SocialSharing } from '@/components/features/referrals';

interface ReferralSectionProps {
  userId: string;
  className?: string;
}

export function ReferralSection({ userId, className }: ReferralSectionProps) {
  const { 
    referralCode, 
    referralLink, 
    isLoading, 
    statistics,
    regenerateCode,
    copyReferralLink
  } = useReferralData();
  
  const [showSharingOptions, setShowSharingOptions] = useState(false);
  
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>
            Invite friends to join Success Kid Community and earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Referral Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-semibold">{statistics.totalReferrals}</p>
                <p className="text-xs text-gray-600">Total Referrals</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-semibold">{statistics.convertedReferrals}</p>
                <p className="text-xs text-gray-600">Conversions</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-semibold">{statistics.conversionRate}%</p>
                <p className="text-xs text-gray-600">Conversion Rate</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-semibold">{statistics.pointsEarned}</p>
                <p className="text-xs text-gray-600">Points Earned</p>
              </div>
            </div>
            
            {/* Referral Code Display */}
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded bg-gray-100 px-3 py-2">
                  <span className="text-lg font-mono font-medium">{referralCode}</span>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyReferralLink()}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSharingOptions(!showSharingOptions)}
                  >
                    {showSharingOptions ? 'Hide Options' : 'Share'}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Social Sharing Options */}
            {showSharingOptions && (
              <SocialSharing 
                referralLink={referralLink}
                defaultMessage="Join me on the Success Kid Community Platform! Sign up with my referral link to get bonus points:"
              />
            )}
            
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => window.location.href = '/referrals'}
              >
                View Full Referral Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
