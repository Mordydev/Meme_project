'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface WelcomeHeaderProps {
  className?: string;
}

/**
 * WelcomeHeader - Personalized greeting with contextual messaging based on user journey stage
 */
export function WelcomeHeader({ className }: WelcomeHeaderProps) {
  const { profile, isLoaded } = useProfile();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  
  // Get appropriate greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);
  
  // Get appropriate user name (display name, first name, or username)
  const userName = useMemo(() => {
    if (!isLoaded) return '';
    
    if (profile?.displayName) return profile.displayName;
    if (user?.firstName) return user.firstName;
    if (user?.username) return user.username;
    
    return 'Success Kid';
  }, [isLoaded, profile, user]);
  
  // Dynamic contextual message based on user journey stage
  // In a real implementation, this would be more sophisticated
  // and based on user activity data
  const contextMessage = useMemo(() => {
    // Example implementation of contextual messages
    const messages = [
      "Track your progress and engage with the community right from this dashboard.",
      "You're making great progress! Keep engaging to earn more rewards.",
      "Your recent achievements are impressive. Ready for your next challenge?",
      "The community has been active today. Check out what's happening!",
    ];
    
    // For demo purposes, just return a random message
    // In production, this would use real user data
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  
  // Simple skeleton loading state
  if (!isLoaded) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 w-full max-w-xl bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  // Return header with animation or without based on user preference
  if (prefersReducedMotion) {
    return (
      <div className={cn("mb-6", className)}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {greeting}, {userName}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {contextMessage}
        </p>
      </div>
    );
  }
  
  return (
    <motion.div 
      className={cn("mb-6", className)}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 
        className="text-3xl font-bold text-gray-900 dark:text-white"
        variants={itemVariants}
      >
        {greeting}, {userName}!
      </motion.h1>
      <motion.p 
        className="mt-2 text-gray-600 dark:text-gray-300"
        variants={itemVariants}
      >
        {contextMessage}
      </motion.p>
    </motion.div>
  );
}
