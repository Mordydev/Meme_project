'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RewardResult {
  amount: number;
  refereeId: string;
  refereeUsername: string;
  eventType: 'signup' | 'conversion' | 'activity';
  timestamp: string;
  totalReferralPoints: number;
}

interface ReferralRewardNotificationProps {
  reward?: RewardResult | null;
  onClose?: () => void;
  duration?: number; // Auto-close duration in ms
  className?: string;
}

/**
 * Animated notification when a referral reward is earned
 */
export function ReferralRewardNotification({
  reward,
  onClose,
  duration = 8000,
  className
}: ReferralRewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(!!reward);
  const prefersReducedMotion = useReducedMotion();

  // Auto-hide notification after duration
  useEffect(() => {
    if (reward && duration > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [reward, duration]);

  // Handle when animation completes
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose?.();
    }
  };

  // Return null if no reward to show
  if (!reward) return null;

  // Get event type description
  const getEventDescription = () => {
    switch (reward.eventType) {
      case 'signup':
        return 'signed up using your referral';
      case 'conversion':
        return 'became an active member';
      case 'activity':
        return 'engaged with the platform';
      default:
        return 'used your referral';
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed bottom-6 right-6 p-4 bg-secondary text-white rounded-lg shadow-lg max-w-md z-50",
            className
          )}
          initial={prefersReducedMotion ? 
            { opacity: 0 } : 
            { opacity: 0, y: 50, scale: 0.8 }
          }
          animate={prefersReducedMotion ? 
            { opacity: 1 } : 
            { opacity: 1, y: 0, scale: 1 }
          }
          exit={prefersReducedMotion ? 
            { opacity: 0 } : 
            { opacity: 0, y: 20, scale: 0.9 }
          }
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">Referral Reward Earned!</h4>
              <p className="mb-2">
                <span className="font-medium">{reward.refereeUsername}</span> {getEventDescription()}
              </p>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">+{reward.amount}</span>
                <span className="text-secondary-100">Success Points</span>
              </div>
              <p className="text-xs mt-2 text-secondary-100">
                You've earned {reward.totalReferralPoints} total points from referrals
              </p>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-secondary-100 hover:text-white"
              aria-label="Close notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              className="bg-white text-secondary hover:bg-secondary-50"
              onClick={() => setIsVisible(false)}
              size="sm"
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
