'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMilestoneData } from '@/hooks/useMarketData';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Milestone } from '@/types';
import ProgressBar from './ProgressBar';
import MilestoneMarkers from './MilestoneMarkers';
import CurrentPosition from './CurrentPosition';
import { MilestoneCelebration } from '@/components/market';

interface MilestoneTrackerProps {
  className?: string;
}

/**
 * MilestoneTracker Component
 * 
 * Displays progress toward community market cap milestones with visual tracker.
 */
export default function MilestoneTracker({ className }: MilestoneTrackerProps) {
  const { 
    currentMarketCap, 
    milestones, 
    nextMilestone, 
    isLoading,
    isCelebrating,
    celebratedMilestone,
    dismissCelebration
  } = useMilestoneData();
  
  // Share functionality for celebration
  const handleShare = () => {
    if (!celebratedMilestone) return;
    
    // Share milestone achievement
    const shareMessage = `Success Kid Token just reached ${formatCurrency(celebratedMilestone.value, 0)} market cap! Join our community at https://successkid.com`;
    
    // Attempt to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Success Kid Milestone',
        text: shareMessage,
        url: 'https://successkid.com',
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback to copying text
      navigator.clipboard.writeText(shareMessage);
      alert('Milestone achievement copied to clipboard!');
    }
  };

  return (
    <>
      <Card className={cn("p-6", className)}>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">Market Milestone Tracker</h3>
              <p className="text-sm text-neutral-500">Progress toward community market cap goals</p>
            </div>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-8">
              <ProgressBar 
                current={currentMarketCap} 
                target={nextMilestone?.value || 0}
                milestones={milestones}
              />
              
              <MilestoneMarkers 
                milestones={milestones} 
                currentMarketCap={currentMarketCap}
              />
              
              <CurrentPosition 
                current={currentMarketCap}
                next={nextMilestone}
              />
            </div>
          )}
        </div>
      </Card>
      
      {/* Milestone Celebration Modal */}
      <MilestoneCelebration
        milestone={celebratedMilestone}
        isVisible={isCelebrating}
        onClose={dismissCelebration}
        onShare={handleShare}
      />
    </>
  );
}
