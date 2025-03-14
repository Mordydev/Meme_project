'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface ReferralCodeDisplayProps {
  referralCode: string;
  referralLink: string;
  className?: string;
  onRegenerateCode?: () => Promise<void>;
  isLoading?: boolean;
}

export function ReferralCodeDisplay({
  referralCode,
  referralLink,
  className,
  onRegenerateCode,
  isLoading = false,
}: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Referral link copied to clipboard',
        variant: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'error',
      });
    }
  };
  
  // Handle regenerating a new code
  const handleRegenerate = async () => {
    if (!onRegenerateCode) return;
    
    setRegenerating(true);
    try {
      await onRegenerateCode();
      toast({
        title: 'Code regenerated!',
        description: 'Your referral code has been updated',
        variant: 'success',
      });
    } catch (err) {
      console.error('Failed to regenerate code:', err);
      toast({
        title: 'Regeneration failed',
        description: 'Unable to generate a new code',
        variant: 'error',
      });
    } finally {
      setRegenerating(false);
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Your Referral Code</CardTitle>
        <CardDescription>Share this code or link with friends to earn points when they join</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="referral-code" className="block text-sm font-medium text-gray-700">
                Referral Code
              </label>
              <div className="relative mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="referral-code"
                  id="referral-code"
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm"
                  value={referralCode}
                  readOnly
                  aria-label="Your referral code"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="referral-link" className="block text-sm font-medium text-gray-700">
              Referral Link
            </label>
            <div className="relative mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="referral-link"
                id="referral-link"
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm"
                value={referralLink}
                readOnly
                aria-label="Your referral link"
              />
              <Button 
                className="absolute inset-y-0 right-0 rounded-l-none" 
                onClick={handleCopy}
                variant="primary"
                aria-label="Copy referral link to clipboard"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      {onRegenerateCode && (
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-xs text-gray-500">
              Want a new code? You can regenerate it anytime.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            isLoading={regenerating || isLoading}
            disabled={regenerating || isLoading}
            aria-label="Generate a new referral code"
          >
            Regenerate Code
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
