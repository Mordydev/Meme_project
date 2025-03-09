'use client';

import { UserAchievement } from '@/types/profile';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AchievementCardProps {
  userAchievement: UserAchievement;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementCard({ 
  userAchievement,
  size = 'md'
}: AchievementCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { achievement, isUnlocked, progress, unlockedAt } = userAchievement;
  
  // Get appropriate sizing classes based on the size prop
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3 gap-1';
      case 'lg':
        return 'p-5 gap-3';
      case 'md':
      default:
        return 'p-4 gap-2';
    }
  };
  
  // Get tier-specific colors
  const getTierColors = () => {
    switch (achievement.tier) {
      case 'bronze':
        return 'bg-amber-700 text-amber-200';
      case 'silver':
        return 'bg-zinc-500 text-zinc-100';
      case 'gold':
        return 'bg-yellow-600 text-yellow-100';
      case 'platinum':
        return 'bg-cyan-600 text-cyan-100';
      default:
        return 'bg-zinc-700 text-zinc-200';
    }
  };
  
  // Format the unlocked time
  const getUnlockedTime = () => {
    if (!unlockedAt) return 'Not unlocked';
    return `Earned ${formatDistanceToNow(new Date(unlockedAt), { addSuffix: true })}`;
  };
  
  return (
    <div
      className={`bg-zinc-800 rounded-lg flex flex-col items-center relative cursor-pointer ${getSizeClasses()}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Achievement icon with tier-specific styling */}
      <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${getTierColors()}`}>
        <span className="text-xl font-bold">{achievement.icon.split('-')[0].charAt(0).toUpperCase()}</span>
      </div>
      
      {/* Achievement title and status */}
      <div className="text-center">
        <div className="font-medium text-hype-white">
          {achievement.title}
        </div>
        <div className="text-xs text-zinc-400">
          {isUnlocked ? getUnlockedTime() : 'Locked'}
        </div>
      </div>
      
      {/* Progress bar for incomplete achievements */}
      {!isUnlocked && progress > 0 && (
        <div className="w-full mt-2 bg-zinc-700 rounded-full h-1.5">
          <div 
            className="bg-battle-yellow h-1.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {/* Achievement details popup */}
      {showDetails && (
        <div className="absolute inset-0 bg-zinc-900/95 rounded-lg p-4 flex flex-col justify-between z-10">
          <div>
            <div className={`text-xs font-medium ${getTierColors()} px-2 py-0.5 rounded-full inline-block mb-2`}>
              {achievement.tier.toUpperCase()} - {achievement.category.toUpperCase()}
            </div>
            <h4 className="text-hype-white font-medium">{achievement.title}</h4>
            <p className="text-xs text-zinc-300 mt-1">{achievement.description}</p>
          </div>
          
          <div className="text-xs text-zinc-400 mt-2">
            <div>Criteria: {achievement.criteria}</div>
            <div>Rewards: {achievement.pointsReward} points</div>
            {isUnlocked ? (
              <div className="text-victory-green">Completed {getUnlockedTime()}</div>
            ) : (
              <div className="mt-2">
                <div className="w-full bg-zinc-700 rounded-full h-1.5 mb-1">
                  <div 
                    className="bg-battle-yellow h-1.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div>{progress}% Complete</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
