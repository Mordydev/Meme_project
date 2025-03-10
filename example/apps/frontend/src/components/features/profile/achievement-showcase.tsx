'use client';

import { UserAchievement } from '@/types/profile';
import { useState } from 'react';
import { AchievementCard } from './achievement-card';

interface AchievementShowcaseProps {
  achievements: UserAchievement[];
  highlightCount?: number;
  showLocked?: boolean;
}

export function AchievementShowcase({
  achievements,
  highlightCount = 6,
  showLocked = false,
}: AchievementShowcaseProps) {
  const [viewAll, setViewAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Sort achievements - unlocked first, then by category and tier
  const sortedAchievements = [...achievements].sort((a, b) => {
    // Unlocked achievements come first
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    
    // Then sort by category
    if (a.achievement.category !== b.achievement.category) {
      return a.achievement.category.localeCompare(b.achievement.category);
    }
    
    // Then sort by tier (gold > silver > bronze)
    const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    return tierOrder[a.achievement.tier] - tierOrder[b.achievement.tier];
  });

  // Filter achievements based on selected category
  const filteredAchievements = selectedCategory
    ? sortedAchievements.filter(a => a.achievement.category === selectedCategory)
    : sortedAchievements;

  // Get unique categories from achievements
  const categories = Array.from(
    new Set(achievements.map(a => a.achievement.category))
  );

  // Calculate the achievements to display based on view state
  const displayAchievements = viewAll
    ? filteredAchievements
    : filteredAchievements.filter(a => a.isUnlocked || showLocked).slice(0, highlightCount);

  // Calculate completion stats
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-2xl font-display text-hype-white mb-2 sm:mb-0">Achievements</h3>
        
        <div className="flex space-x-2 items-center">
          <div className="text-sm text-zinc-300">
            <span className="text-battle-yellow font-bold">{unlockedCount}</span> / {totalCount} Unlocked ({completionPercentage}%)
          </div>
          <button
            onClick={() => setViewAll(!viewAll)}
            className="text-xs px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-zinc-200"
          >
            {viewAll ? 'Show Less' : 'View All'}
          </button>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1 rounded-full ${
              selectedCategory === null
                ? 'bg-battle-yellow text-wild-black'
                : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs px-3 py-1 rounded-full ${
                selectedCategory === category
                  ? 'bg-battle-yellow text-wild-black'
                  : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayAchievements.map(userAchievement => (
          <AchievementCard
            key={userAchievement.achievementId}
            userAchievement={userAchievement}
          />
        ))}
      </div>

      {!viewAll && filteredAchievements.length > highlightCount && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setViewAll(true)}
            className="text-sm px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-zinc-200"
          >
            View {filteredAchievements.length - highlightCount} More Achievements
          </button>
        </div>
      )}
    </div>
  );
}
