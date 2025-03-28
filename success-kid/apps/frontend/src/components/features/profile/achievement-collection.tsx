'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui';

// Types
export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
  progress?: number; // 0-100
  category?: string;
  difficulty?: 'common' | 'uncommon' | 'rare' | 'epic';
  pointsReward?: number;
}

interface AchievementCollectionProps {
  userId: string;
  onAchievementSelect?: (id: string) => void;
  layout?: 'grid' | 'list';
  className?: string;
  achievements?: UserAchievement[];
  isLoading?: boolean;
}

interface AchievementCardProps {
  achievement: UserAchievement;
  isSelected?: boolean;
  onClick?: () => void;
}

// Helper function to get background color based on difficulty
function getDifficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case 'common':
      return 'bg-green-100 border-green-200 text-green-800';
    case 'uncommon':
      return 'bg-blue-100 border-blue-200 text-blue-800';
    case 'rare':
      return 'bg-purple-100 border-purple-200 text-purple-800';
    case 'epic':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    default:
      return 'bg-slate-100 border-slate-200 text-slate-800';
  }
}

// AchievementCard component for individual achievements
function AchievementCard({ achievement, isSelected, onClick }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const difficultyColor = getDifficultyColor(achievement.difficulty);
  
  return (
    <div 
      className={`
        relative rounded-lg overflow-hidden border cursor-pointer transition-all
        ${isUnlocked ? 'bg-card' : 'bg-muted/30 grayscale'}
        ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}
      `}
      onClick={onClick}
    >
      <div className="p-4 flex flex-col items-center">
        {/* Badge Image */}
        <div className={`
          w-20 h-20 rounded-full p-2 mb-3 relative flex items-center justify-center
          ${isUnlocked ? difficultyColor : 'bg-muted-foreground/10 border-muted-foreground/20'}
        `}>
          {achievement.iconUrl ? (
            <Image
              src={achievement.iconUrl}
              alt={achievement.title}
              width={64}
              height={64}
              className="object-contain"
            />
          ) : (
            <div className="text-3xl">🏆</div>
          )}
          
          {/* Progress indicator for locked achievements */}
          {!isUnlocked && achievement.progress !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * achievement.progress / 100)}
                  className="text-primary/20"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <span className="absolute text-xs font-bold">
                {achievement.progress}%
              </span>
            </div>
          )}
        </div>
        
        {/* Title */}
        <h3 className="font-medium text-center mb-1">{achievement.title}</h3>
        
        {/* Status and Date */}
        {isUnlocked ? (
          <div className="text-xs text-muted-foreground">
            Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Locked</div>
        )}
      </div>
    </div>
  );
}

// AchievementDetail component for modal view
function AchievementDetail({ achievement }: { achievement: UserAchievement }) {
  const isUnlocked = !!achievement.unlockedAt;
  const difficultyColor = getDifficultyColor(achievement.difficulty);
  
  return (
    <div className="flex flex-col items-center p-4">
      {/* Badge Image - larger for the detail view */}
      <div className={`
        w-32 h-32 rounded-full p-4 mb-4 relative flex items-center justify-center
        ${isUnlocked ? difficultyColor : 'bg-muted-foreground/10 border-muted-foreground/20'}
      `}>
        {achievement.iconUrl ? (
          <Image
            src={achievement.iconUrl}
            alt={achievement.title}
            width={96}
            height={96}
            className="object-contain"
          />
        ) : (
          <div className="text-5xl">🏆</div>
        )}
      </div>
      
      {/* Achievement Details */}
      <h2 className="text-xl font-bold mb-2">{achievement.title}</h2>
      
      {/* Status */}
      <div className="mb-4">
        {isUnlocked ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Unlocked on {new Date(achievement.unlockedAt!).toLocaleDateString()}
          </span>
        ) : (
          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
            Locked - {achievement.progress || 0}% Complete
          </span>
        )}
      </div>
      
      {/* Description */}
      <p className="text-center mb-4">{achievement.description}</p>
      
      {/* Additional Details */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {/* Difficulty */}
        <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
          <span className="text-xs text-muted-foreground">Difficulty</span>
          <span className="font-medium capitalize">{achievement.difficulty || 'Common'}</span>
        </div>
        
        {/* Points Reward */}
        <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
          <span className="text-xs text-muted-foreground">Reward</span>
          <span className="font-medium">{achievement.pointsReward || 0} Points</span>
        </div>
      </div>
    </div>
  );
}

// Empty state for when there are no achievements
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">🏆</span>
      </div>
      <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
      <p className="text-muted-foreground max-w-sm">
        Start engaging with the platform to earn achievements and show them off on your profile!
      </p>
    </div>
  );
}

// Main AchievementCollection component
export function AchievementCollection({
  userId,
  onAchievementSelect,
  layout = 'grid',
  className,
  achievements = [],
  isLoading = false,
}: AchievementCollectionProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null);
  
  // Mock data for development - would be replaced with actual API call
  const mockAchievements: UserAchievement[] = [
    {
      id: 'achievement1',
      title: 'First Steps',
      description: 'Complete your profile setup and join the Success Kid community.',
      iconUrl: '/images/badges/first-steps.svg',
      unlockedAt: new Date().toISOString(),
      difficulty: 'common',
      pointsReward: 50
    },
    {
      id: 'achievement2',
      title: 'Content Creator',
      description: 'Create your first post on the platform.',
      iconUrl: '/images/badges/content-creator.svg',
      unlockedAt: new Date(Date.now() - 86400000).toISOString(),
      difficulty: 'common',
      pointsReward: 100
    },
    {
      id: 'achievement3',
      title: 'Conversation Starter',
      description: 'Receive 5 comments on one of your posts.',
      iconUrl: '/images/badges/conversation-starter.svg',
      progress: 60,
      difficulty: 'uncommon',
      pointsReward: 200
    },
    {
      id: 'achievement4',
      title: 'Rising Star',
      description: 'Reach the daily leaderboard top 10.',
      iconUrl: '/images/badges/rising-star.svg',
      progress: 30,
      difficulty: 'rare',
      pointsReward: 400
    }
  ];
  
  // Use mock data for now - would be replaced with actual data
  const displayAchievements = achievements.length > 0 ? achievements : mockAchievements;
  
  // Handle achievement selection
  const handleAchievementClick = (achievement: UserAchievement) => {
    setSelectedAchievement(achievement);
    if (onAchievementSelect) {
      onAchievementSelect(achievement.id);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="animate-pulse">Loading achievements...</div>
      </div>
    );
  }
  
  // Empty state
  if (displayAchievements.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <>
      <div className={`
        ${layout === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'space-y-4'}
        ${className}
      `}>
        {displayAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isSelected={selectedAchievement?.id === achievement.id}
            onClick={() => handleAchievementClick(achievement)}
          />
        ))}
      </div>
      
      {/* Achievement Detail Modal */}
      <Dialog
        isOpen={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        title="Achievement Details"
      >
        {selectedAchievement && <AchievementDetail achievement={selectedAchievement} />}
      </Dialog>
    </>
  );
}
