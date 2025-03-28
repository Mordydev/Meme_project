'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReferral } from '@/hooks/useReferral';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { Copy, CheckCircle, Share, Users, ExternalLink, QrCode } from 'lucide-react';

interface ReferralCardProps {
  className?: string;
}

// Mock data for development
const MOCK_REFERRAL_DATA = {
  referralCode: 'SK123456',
  referralLink: 'https://successkid.io/ref/SK123456',
  statistics: {
    pending: 3,
    successful: 12,
    totalPoints: 6000
  }
};

/**
 * ReferralCard - Promotes referral program with easy sharing functionality
 */
export function ReferralCard({ className }: ReferralCardProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // In a real implementation, this would use the actual hook
  // const { referralCode, referralLink, statistics, isLoading, shareToChannel, lastShareResult } = useReferral();
  
  // For development, we'll use mock data
  const [referralData] = useState(MOCK_REFERRAL_DATA);
  const isLoading = false;
  
  // UI states
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle copy to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  // Handle copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  // Handle share
  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback to copy link if Web Share API is not available
      handleCopyLink();
      return;
    }
    
    try {
      await navigator.share({
        title: 'Join me on Success Kid Platform',
        text: `Use my referral code ${referralData.referralCode} to join the Success Kid Community Platform and we'll both earn 500 Success Points!`,
        url: referralData.referralLink
      });
    } catch (err) {
      console.error('Failed to share: ', err);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("animate-pulse space-y-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5", className)}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Refer Friends
        </h3>
        <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200
          text-xs px-2 py-1 rounded-full font-medium">
          +500 SP for both
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Invite friends to join Success Kid and you'll both receive 500 Success Points when they sign up!
      </p>
      
      {/* Referral Code */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-grow bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm">
          {referralData.referralCode}
        </div>
        <button
          onClick={handleCopyCode}
          className="bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 
            dark:hover:bg-primary-900/50 text-primary-800 dark:text-primary-200
            p-2 rounded-lg transition-colors"
          aria-label="Copy referral code"
        >
          {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center px-3 py-2 bg-primary-500 text-white 
            rounded-md hover:bg-primary-600 transition-colors"
        >
          <Copy className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Copy Link</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center justify-center px-3 py-2 bg-primary-50 dark:bg-primary-900/10 
            text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800
            rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
        >
          <Share className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
      
      {/* Statistics */}
      <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-4 h-4 text-primary-500 mr-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Your Referrals
            </span>
          </div>
          <a 
            href="/referrals"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center"
          >
            Details
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {referralData.statistics.pending}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Pending
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {referralData.statistics.successful}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Successful
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-accent-600 dark:text-accent-400">
              {referralData.statistics.totalPoints}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Points Earned
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
