'use client';

import React from 'react';
import Image from 'next/image';
import { Achievement } from '@/store/useAchievementStore';
import { ProgressRing } from './ProgressRing';

/**
 * Props for AchievementDetail component
 */
interface AchievementDetailProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress: number;
  onClose?: () => void;
  className?: string;
}

/**
 * Detailed view of an achievement with requirements and progress
 */
export function AchievementDetail({
  achievement,
  isUnlocked,
  progress,
  onClose,
  className = '',
}: AchievementDetailProps) {
  // Format date if available
  const formatDate = (date?: Date) => {
    if (!date) return 'Not yet unlocked';
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'onboarding': return 'Onboarding';
      case 'content': return 'Content Creation';
      case 'engagement': return 'Community Engagement';
      case 'holder': return 'Token Holder';
      case 'community': return 'Community Builder';
      case 'milestone': return 'Milestone';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  
  // Get difficulty color class
  const getDifficultyColorClass = (difficulty: string) => {
    switch (difficulty) {
      case 'common': return 'bg-neutral-100 text-neutral-800';
      case 'uncommon': return 'bg-green-100 text-green-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-amber-100 text-amber-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with close button */}
      <div className="bg-primary-500 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Achievement Details</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      {/* Achievement content */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Badge and status */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Image
                src={achievement.badgeUrl}
                alt={achievement.title}
                width={128}
                height={128}
                className={`rounded-lg object-contain ${isUnlocked ? 'saturate-100' : 'saturate-0'}`}
              />
              
              {/* Progress overlay for incomplete achievements */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ProgressRing
                    progress={progress}
                    size={128}
                    strokeWidth={6}
                    bgColor="rgba(0, 0, 0, 0.1)"
                    fgColor="rgba(30, 136, 229, 0.8)"
                  />
                </div>
              )}
              
              {/* Unlocked indicator */}
              {isUnlocked && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full h-8 w-8 flex items-center justify-center shadow-md">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColorClass(achievement.difficulty)}`}>
                {achievement.difficulty.charAt(0).toUpperCase() + achievement.difficulty.slice(1)}
              </div>
              
              <div className="mt-2 text-sm">
                <span className="text-neutral-500">Category:</span>{' '}
                <span className="font-medium">{getCategoryName(achievement.category)}</span>
              </div>
              
              <div className="mt-1 text-sm">
                <span className="text-neutral-500">Reward:</span>{' '}
                <span className="font-medium text-primary-600">{achievement.pointsReward} Points</span>
              </div>
            </div>
          </div>
          
          {/* Description and details */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-neutral-800">{achievement.title}</h3>
            
            <p className="mt-2 text-neutral-600">{achievement.description}</p>
            
            {/* Requirements */}
            <div className="mt-4">
              <h4 className="font-medium text-neutral-800">Requirements</h4>
              <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {Object.entries(achievement.requirements).map(([key, value]) => (
                    <li key={key} className="text-neutral-700">
                      {typeof key === 'string' && key.includes('_') 
                        ? key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
                        : key}: {value.toString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Status */}
            <div className="mt-4">
              <h4 className="font-medium text-neutral-800">Status</h4>
              <div className={`mt-2 p-3 rounded-lg ${isUnlocked ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm ${isUnlocked ? 'text-green-800' : 'text-blue-800'}`}>
                  {isUnlocked 
                    ? `Unlocked on ${formatDate(achievement.unlockedAt)}` 
                    : progress > 0 
                      ? `In progress - ${progress}% complete` 
                      : 'Not started yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
