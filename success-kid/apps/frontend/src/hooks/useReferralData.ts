import { useCallback, useEffect, useState } from 'react';
import { useReferralStore } from '@/store/useReferralStore';
import { apiClient } from '@/lib/api-client';

interface UseReferralReturn {
  referralCode: string;
  referralLink: string;
  isLoading: boolean;
  error: Error | null;
  statistics: {
    totalReferrals: number;
    convertedReferrals: number;
    pendingReferrals: number;
    conversionRate: number;
    pointsEarned: number;
  };
  referrals: Array<{
    userId: string;
    username: string;
    avatarUrl?: string;
    registeredAt: string;
    convertedAt?: string;
    status: 'pending' | 'active' | 'converted';
    pointsGenerated: number;
  }>;
  isReferral: boolean;
  referrerId?: string;
  regenerateCode: () => Promise<void>;
  copyReferralLink: () => Promise<boolean>;
}

/**
 * Hook for accessing and managing user referral data
 */
export function useReferralData(): UseReferralReturn {
  const {
    referralCode,
    referralLink,
    isCodeLoading,
    statistics,
    isStatsLoading,
    referrals,
    isReferralsLoading,
    isReferral,
    referrerId,
    error,
    fetchReferralCode,
    fetchStatistics,
    fetchReferrals,
    generateNewCode,
    resetError,
  } = useReferralStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch all referral data on mount
  useEffect(() => {
    setIsLoading(true);
    
    const fetchData = async () => {
      try {
        // If we don't have a referral code yet, fetch it
        if (!referralCode) {
          await fetchReferralCode();
        }
        
        // Fetch statistics and referrals
        await Promise.all([
          fetchStatistics(),
          fetchReferrals()
        ]);
      } catch (err) {
        console.error('Error fetching referral data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Clean up error on unmount
    return () => resetError();
  }, [fetchReferralCode, fetchStatistics, fetchReferrals, resetError, referralCode]);
  
  // Function to regenerate referral code
  const regenerateCode = useCallback(async () => {
    setIsLoading(true);
    try {
      await generateNewCode();
    } finally {
      setIsLoading(false);
    }
  }, [generateNewCode]);
  
  // Function to copy referral link to clipboard
  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    if (!referralLink) return false;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, [referralLink]);
  
  return {
    referralCode,
    referralLink,
    isLoading: isLoading || isCodeLoading || isStatsLoading || isReferralsLoading,
    error,
    statistics,
    referrals,
    isReferral,
    referrerId,
    regenerateCode,
    copyReferralLink,
  };
}
