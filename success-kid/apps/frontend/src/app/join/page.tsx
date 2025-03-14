'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store';

interface ReferrerInfo {
  referrerId: string;
  referrerUsername: string;
  campaign?: {
    id: string;
    name: string;
    description: string;
    bonusReward: number;
  };
}

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useAuthStore();
  
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  // Handle referral code validation
  useEffect(() => {
    const code = searchParams.get('ref');
    const campaign = searchParams.get('campaign');
    
    if (code) {
      setReferralCode(code);
      setIsValidating(true);
      
      // Validate referral code
      const validateCode = async () => {
        try {
          // In a real implementation, this would call the API
          // const response = await apiClient.get(`/api/v1/referrals/validate/${code}?campaign=${campaign || ''}`);
          // const data = response.data;
          
          // For demo purposes, simulate validation
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock validation result
          const isCodeValid = code.length >= 6;
          setIsValid(isCodeValid);
          
          if (isCodeValid) {
            setReferrerInfo({
              referrerId: 'user_123',
              referrerUsername: 'cryptoenthusiast',
              campaign: campaign ? {
                id: campaign,
                name: 'Spring Referral Boost',
                description: 'Get 2x points for all referrals during our Spring promotion!',
                bonusReward: 500,
              } : undefined,
            });
          } else {
            setReferrerInfo(null);
          }
        } catch (error) {
          console.error('Error validating referral code:', error);
          setIsValid(false);
          setReferrerInfo(null);
        } finally {
          setIsValidating(false);
        }
      };
      
      validateCode();
    }
  }, [searchParams]);
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  // Handle sign up button click
  const handleSignUp = () => {
    // Navigate to registration flow with referral code in query parameters
    const params = new URLSearchParams();
    if (referralCode) params.set('ref', referralCode);
    if (referrerInfo?.campaign?.id) params.set('campaign', referrerInfo.campaign.id);
    
    router.push(`/auth/register?${params.toString()}`);
  };
  
  // Handle login button click
  const handleLogin = () => {
    // Navigate to login flow with referral code in query parameters
    const params = new URLSearchParams();
    if (referralCode) params.set('ref', referralCode);
    if (referrerInfo?.campaign?.id) params.set('campaign', referrerInfo.campaign.id);
    
    router.push(`/auth/login?${params.toString()}`);
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="mx-auto w-full max-w-lg">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold md:text-3xl">You've Been Invited!</CardTitle>
            <CardDescription>
              Join the Success Kid Community Platform with your special invite
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isValidating ? (
              <div className="py-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600">Validating your invitation...</p>
              </div>
            ) : !referralCode ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-600">No referral code provided.</p>
                <div className="mt-6 flex flex-col space-y-3">
                  <Button onClick={() => router.push('/auth/register')}>Sign Up Anyway</Button>
                  <Button variant="outline" onClick={() => router.push('/auth/login')}>
                    Already Have an Account?
                  </Button>
                </div>
              </div>
            ) : !isValid ? (
              <div className="py-8 text-center">
                <p className="text-sm text-red-600">Invalid referral code. This invite may have expired.</p>
                <div className="mt-6 flex flex-col space-y-3">
                  <Button onClick={() => router.push('/auth/register')}>Sign Up Anyway</Button>
                  <Button variant="outline" onClick={() => router.push('/auth/login')}>
                    Already Have an Account?
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {referrerInfo && (
                  <div className="mb-6 rounded-lg bg-primary-50 p-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{referrerInfo.referrerUsername}</span> has invited 
                      you to join the Success Kid Community Platform.
                    </p>
                    
                    {referrerInfo.campaign && (
                      <div className="mt-4 rounded-md bg-white p-3 shadow-sm">
                        <h3 className="text-sm font-semibold text-primary">{referrerInfo.campaign.name}</h3>
                        <p className="mt-1 text-xs text-gray-600">{referrerInfo.campaign.description}</p>
                        <p className="mt-2 text-xs font-medium text-success-600">
                          Bonus: {referrerInfo.campaign.bonusReward} Success Points when you join!
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="rounded-md bg-success-50 p-3">
                    <h3 className="text-sm font-semibold text-success-700">Your Benefits</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-600">
                      <li>Get a welcome bonus of 100 Success Points</li>
                      <li>Referral bonus of 250 Success Points</li>
                      <li>Special Achievement Badge for joining via referral</li>
                      {referrerInfo?.campaign && (
                        <li>Additional {referrerInfo.campaign.bonusReward} Points from campaign</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <Button onClick={handleSignUp}>Sign Up Now</Button>
                    <Button variant="outline" onClick={handleLogin}>
                      Already Have an Account?
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
