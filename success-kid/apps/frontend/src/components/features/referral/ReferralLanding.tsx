'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/api-client';

interface ReferralLandingProps {
  className?: string;
  onRegister?: (data: { referralCode: string; referrerId: string }) => void;
}

/**
 * Landing page for users arriving via a referral link
 */
export function ReferralLanding({ className, onRegister }: ReferralLandingProps) {
  const searchParams = useSearchParams();
  const [referralData, setReferralData] = useState<{
    isValid: boolean;
    referrerId?: string;
    referrerUsername?: string;
    campaign?: {
      id: string;
      name: string;
      description: string;
      bonusReward: number;
    }
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const referralCode = searchParams?.get('ref') || '';
  const campaignId = searchParams?.get('campaign') || '';

  // Validate the referral code
  useEffect(() => {
    async function validateReferral() {
      if (!referralCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/referrals/validate/${referralCode}`);
        setReferralData(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error validating referral:', err);
        setError('Unable to validate referral code');
        setIsLoading(false);
      }
    }

    validateReferral();
  }, [referralCode]);

  // Handle registration button click
  const handleRegister = () => {
    if (referralData?.isValid && referralData.referrerId) {
      onRegister?.({
        referralCode,
        referrerId: referralData.referrerId
      });
    }
  };

  // If no referral code, don't render anything special
  if (!referralCode || !isLoading && !referralData?.isValid) {
    return null;
  }

  return (
    <Card className={cn("border-2 border-secondary-400", className)}>
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-200 rounded w-full"></div>
            <div className="h-10 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          </div>
        ) : referralData?.isValid ? (
          <div className="text-center">
            <div className="mb-6">
              {referralData.campaign ? (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 mb-4">
                  <h3 className="text-xl font-bold text-secondary-700">
                    {referralData.campaign.name}
                  </h3>
                  <p className="text-secondary-600 mt-1">
                    {referralData.campaign.description}
                  </p>
                  {referralData.campaign.bonusReward > 0 && (
                    <div className="mt-2 inline-block bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-sm">
                      Bonus: {referralData.campaign.bonusReward} points
                    </div>
                  )}
                </div>
              ) : (
                <h3 className="text-xl font-bold mb-2">
                  You've been invited!
                </h3>
              )}

              <p className="text-lg">
                <span className="font-semibold">{referralData.referrerUsername}</span> invited you to join the Success Kid Community Platform
              </p>
              
              <div className="mt-4 mb-6">
                <p className="text-neutral-600">
                  Register now and you'll both receive bonus Success Points to get started!
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  className="px-8"
                  onClick={handleRegister}
                >
                  Register Now
                </Button>
              </div>
              
              <p className="text-xs text-neutral-500 mt-4">
                Referral code: {referralCode}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Invalid Referral</h3>
            <p className="text-neutral-600">
              This referral link is no longer valid or has expired.
            </p>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>
        )}
      </motion.div>
    </Card>
  );
}
