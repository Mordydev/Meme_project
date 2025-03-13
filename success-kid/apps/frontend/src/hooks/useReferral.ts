'use client';

import { useEffect, useState } from 'react';
import { useReferralStore } from '@/store/useReferralStore';
import { useAuth } from './useAuth';

/**
 * Interface for share channel options
 */
export type SocialChannel = 
  | 'copy' 
  | 'email' 
  | 'twitter' 
  | 'facebook' 
  | 'telegram' 
  | 'whatsapp' 
  | 'linkedin';

/**
 * Result of a share operation
 */
export interface ShareResult {
  success: boolean;
  channel: SocialChannel;
  error?: Error;
}

/**
 * Custom hook for referral system functionality
 */
export function useReferral() {
  const { isSignedIn, isLoaded } = useAuth();
  const [lastShareResult, setLastShareResult] = useState<ShareResult | null>(null);
  
  const {
    referralCode,
    referralLink,
    qrCodeUrl,
    statistics,
    isReferral,
    referrerId,
    isLoading,
    error,
    fetchReferralInfo,
    resetError,
    trackReferralShare,
    activeCampaigns,
    selectedCampaign,
    campaignReferralLink,
    fetchActiveCampaigns,
    selectCampaign,
  } = useReferralStore();

  // Fetch referral info when authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchReferralInfo();
    }
  }, [isLoaded, isSignedIn, fetchReferralInfo]);

  /**
   * Get the appropriate share link based on the current state
   */
  const getShareLink = (): string => {
    return selectedCampaign && campaignReferralLink ? campaignReferralLink : referralLink;
  };

  /**
   * Get the default share message based on the current state
   */
  const getDefaultShareMessage = (): string => {
    const baseMessage = "Join me on the Success Kid Community Platform!";
    
    if (selectedCampaign) {
      return `${baseMessage} ${selectedCampaign.description} ${getShareLink()}`;
    }
    
    return `${baseMessage} Use my referral code ${referralCode} or click this link: ${getShareLink()}`;
  };

  /**
   * Share referral link to a specific channel
   */
  const shareToChannel = async (
    channel: SocialChannel, 
    customMessage?: string
  ): Promise<ShareResult> => {
    const message = customMessage || getDefaultShareMessage();
    const link = getShareLink();
    
    try {
      let success = false;
      
      switch (channel) {
        case 'copy':
          await navigator.clipboard.writeText(link);
          success = true;
          break;
          
        case 'email':
          window.open(`mailto:?subject=Join me on Success Kid Platform&body=${encodeURIComponent(message)}`);
          success = true;
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`);
          success = true;
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(message)}`);
          success = true;
          break;
          
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`);
          success = true;
          break;
          
        case 'whatsapp':
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
          success = true;
          break;
          
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`);
          success = true;
          break;
          
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
      
      // Track share event if successful
      if (success) {
        trackReferralShare(channel);
      }
      
      const result = { success, channel };
      setLastShareResult(result);
      return result;
    } catch (error) {
      console.error(`Error sharing to ${channel}:`, error);
      const result = { 
        success: false, 
        channel, 
        error: error instanceof Error ? error : new Error(`Failed to share to ${channel}`)
      };
      setLastShareResult(result);
      return result;
    }
  };

  /**
   * Check if Web Share API is available in the browser
   */
  const isWebShareAvailable = (): boolean => {
    return typeof navigator !== 'undefined' && !!navigator.share;
  };

  /**
   * Share using the Web Share API if available
   */
  const shareWithNative = async (customMessage?: string): Promise<ShareResult> => {
    if (!isWebShareAvailable()) {
      return { success: false, channel: 'copy' };
    }
    
    const message = customMessage || getDefaultShareMessage();
    const link = getShareLink();
    
    try {
      await navigator.share({
        title: 'Join Success Kid Platform',
        text: message,
        url: link,
      });
      
      // Track share event
      trackReferralShare('native');
      
      const result = { success: true, channel: 'copy' };
      setLastShareResult(result);
      return result;
    } catch (error) {
      console.error('Error with native share:', error);
      const result = { 
        success: false, 
        channel: 'copy', 
        error: error instanceof Error ? error : new Error('Failed to share')
      };
      setLastShareResult(result);
      return result;
    }
  };

  return {
    // Referral data
    referralCode,
    referralLink,
    qrCodeUrl,
    statistics,
    isReferral,
    referrerId,
    
    // Campaign data
    activeCampaigns,
    selectedCampaign,
    campaignReferralLink,
    fetchActiveCampaigns,
    selectCampaign,
    
    // Sharing functionality
    getShareLink,
    getDefaultShareMessage,
    shareToChannel,
    isWebShareAvailable,
    shareWithNative,
    lastShareResult,
    
    // State
    isLoading,
    error,
    resetError,
  };
}
