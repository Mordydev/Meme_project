'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useProfile } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';
import {
  PenLine,
  MessageSquare,
  Wallet,
  Users,
  TrendingUp,
  Award,
  Bookmark
} from 'lucide-react';

interface QuickActionsProps {
  className?: string;
}

interface ActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  url: string;
  priority: number;
  condition?: boolean;
}

/**
 * QuickActions - Provides context-aware shortcuts to high-value user actions
 */
export function QuickActions({ className }: QuickActionsProps) {
  const prefersReducedMotion = useReducedMotion();
  const { profile } = useProfile();
  const { connected } = useWallet();
  
  // Define all possible actions
  const allActions: ActionItem[] = useMemo(() => [
    {
      id: 'create-content',
      icon: <PenLine className="w-4 h-4" />,
      label: 'Create Content',
      url: '/community/create',
      priority: 90
    },
    {
      id: 'join-discussions',
      icon: <MessageSquare className="w-4 h-4" />,
      label: 'Join Discussions',
      url: '/community',
      priority: 80
    },
    {
      id: 'connect-wallet',
      icon: <Wallet className="w-4 h-4" />,
      label: 'Connect Wallet',
      url: '/wallet/connect',
      priority: 95,
      condition: !connected
    },
    {
      id: 'find-people',
      icon: <Users className="w-4 h-4" />,
      label: 'Find People',
      url: '/community/people',
      priority: 70
    },
    {
      id: 'market-data',
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Market Data',
      url: '/market',
      priority: 60
    },
    {
      id: 'view-achievements',
      icon: <Award className="w-4 h-4" />,
      label: 'View Achievements',
      url: '/achievements',
      priority: 75
    },
    {
      id: 'saved-content',
      icon: <Bookmark className="w-4 h-4" />,
      label: 'Saved Content',
      url: '/profile/saved',
      priority: 50
    }
  ], [connected]);
  
  // Filter and sort actions based on relevance and conditions
  const availableActions = useMemo(() => {
    return allActions
      .filter(action => action.condition === undefined || action.condition)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6); // Limit to 6 actions
  }, [allActions]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      className={cn("grid grid-cols-2 gap-3", className)}
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {availableActions.map((action) => (
        <motion.a
          key={action.id}
          href={action.url}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-lg text-center",
            "transition-all duration-200",
            "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
            "border border-gray-200 dark:border-gray-700",
            action.id === 'connect-wallet' && !connected 
              ? "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20" 
              : ""
          )}
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center mb-2",
            "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
          )}>
            {action.icon}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {action.label}
          </span>
        </motion.a>
      ))}
    </motion.div>
  );
}
