'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReferral } from '@/hooks/useReferral';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useReferralStore } from '@/store/useReferralStore';
import { cn } from '@/lib/utils';

interface ReferralCodeDisplayProps {
  className?: string;
  displayQrCode?: boolean;
}

/**
 * Component to display the user's referral code with copy functionality
 */
export function ReferralCodeDisplay({ 
  className,
  displayQrCode = false,
}: ReferralCodeDisplayProps) {
  const { referralCode, referralLink, qrCodeUrl, isLoading } = useReferral();
  const [isCopied, setIsCopied] = useState(false);
  const { generateNewReferralCode } = useReferralStore();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleGenerateNew = () => {
    if (confirm('Are you sure you want to generate a new referral code? Your old code will no longer work.')) {
      generateNewReferralCode();
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Your Referral Code</h3>
          <p className="text-sm text-neutral-500 mb-3">
            Share this code with friends to earn rewards when they join
          </p>
          
          <div className="flex items-center space-x-2">
            <div className="bg-secondary/10 border border-secondary/20 rounded p-3 font-mono text-lg tracking-wide flex-1 text-center">
              {isLoading ? (
                <div className="h-6 w-24 bg-neutral-200 animate-pulse rounded"></div>
              ) : (
                referralCode
              )}
            </div>
            <Button 
              onClick={handleCopyCode}
              variant="outline"
              className="min-w-20"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-1">Referral Link</h3>
          <p className="text-sm text-neutral-500 mb-3">
            Send this link directly to friends to make registration even easier
          </p>
          
          <div className="flex items-center space-x-2">
            <div className="bg-secondary/10 border border-secondary/20 rounded p-3 text-sm text-neutral-800 truncate flex-1">
              {isLoading ? (
                <div className="h-6 w-full bg-neutral-200 animate-pulse rounded"></div>
              ) : (
                referralLink
              )}
            </div>
            <Button 
              onClick={handleCopyLink}
              variant="outline"
              className="min-w-20"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {displayQrCode && qrCodeUrl && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">QR Code</h3>
            <p className="text-sm text-neutral-500 mb-3">
              Let friends scan this code to join using your referral
            </p>
            
            <div className="flex justify-center">
              <motion.img 
                src={qrCodeUrl} 
                alt="Referral QR Code"
                className="w-32 h-32"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-neutral-500 mb-3">
            Need a new code? You can generate a fresh referral code any time.
          </p>
          <Button 
            onClick={handleGenerateNew} 
            variant="secondary"
            className="w-full"
            disabled={isLoading}
          >
            Generate New Code
          </Button>
        </div>
      </div>
    </Card>
  );
}
