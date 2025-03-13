'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AchievementWithProgress, AchievementCategory } from '@/types';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AchievementGridProps {
  achievements: AchievementWithProgress[];
  isLoading?: boolean;
  layout?: 'grid' | 'list';
  onSelect?: (id: string) => void;
  selectedId?: string;
  className?: string;
}

type FilterType = 'all' | 'unlocked' | 'locked' | AchievementCategory;

/**
 * AchievementGrid
 * 
 * Display a collection of achievements with filtering and selection functionality.
 */
export function AchievementGrid({
  achievements,
  isLoading = false,
  layout = 'grid',
  onSelect,
  selectedId,
  className
}: AchievementGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredAchievements, setFilteredAchievements] = useState<AchievementWithProgress[]>(achievements);
  
  // Get all unique categories from achievements
  const categories = Array.from(new Set(achievements.map(a => a.category)));
  
  // Update filtered achievements when achievements or filter changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredAchievements(achievements);
    } else if (filter === 'unlocked') {
      setFilteredAchievements(achievements.filter(a => a.unlocked));
    } else if (filter === 'locked') {
      setFilteredAchievements(achievements.filter(a => !a.unlocked));
    } else {
      // Filter by category
      setFilteredAchievements(achievements.filter(a => a.category === filter));
    }
  }, [achievements, filter]);
  
  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <Button
          size="sm"
          variant={filter === 'all' ? "default" : "outline"}
          onClick={() => setFilter('all')}
        >
          All ({achievements.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'unlocked' ? "default" : "outline"}
          onClick={() => setFilter('unlocked')}
        >
          Unlocked ({achievements.filter(a => a.unlocked).length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'locked' ? "default" : "outline"}
          onClick={() => setFilter('locked')}
        >
          Locked ({achievements.filter(a => !a.unlocked).length})
        </Button>
        
        {/* Category filters - only show if there are multiple categories */}
        {categories.length > 1 && categories.map(category => (
          <Button
            key={category}
            size="sm"
            variant={filter === category ? "default" : "outline"}
            onClick={() => setFilter(category)}
            className="capitalize"
          >
            {category} ({achievements.filter(a => a.category === category).length})
          </Button>
        ))}
      </div>
      
      {/* Achievement Grid/List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium">No achievements found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            {filter === 'unlocked' 
              ? 'You haven't unlocked any achievements in this category yet. Keep participating to earn rewards!' 
              : filter === 'locked'
                ? 'There are no more achievements to unlock in this category.'
                : 'No achievements match the current filter.'}
          </p>
        </div>
      ) : (
        <motion.div layout className={cn(
          layout === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" 
            : "space-y-4"
        )}>
          <AnimatePresence>
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                layout
              >
                <AchievementCard
                  achievement={achievement}
                  onClick={() => handleSelect(achievement.id)}
                  isSelected={selectedId === achievement.id}
                  layout={layout}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onClick?: () => void;
  isSelected?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

/**
 * AchievementCard
 * 
 * Display a single achievement with progress and unlock status.
 */
function AchievementCard({
  achievement,
  onClick,
  isSelected = false,
  layout = 'grid',
  className
}: AchievementCardProps) {
  // Default icon if no badge URL provided
  const defaultIcon = achievement.category === 'milestones' ? '🏅' : 
                      achievement.category === 'content' ? '✍️' :
                      achievement.category === 'engagement' ? '👋' :
                      achievement.category === 'wallet' ? '💰' : '🏆';
  
  // Special effects for difficulty levels
  const difficultyEffects = {
    common: '',
    uncommon: 'border-primary/30',
    rare: 'border-secondary/50',
    epic: 'border-accent/60 shadow-md shadow-accent/10'
  };
  
  const cardClasses = cn(
    "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md",
    isSelected && "ring-2 ring-primary",
    !achievement.unlocked && "opacity-70 hover:opacity-90",
    difficultyEffects[achievement.difficulty],
    className
  );
  
  if (layout === 'grid') {
    return (
      <Card 
        className={cardClasses}
        onClick={onClick}
      >
        <CardContent className="p-4 flex flex-col items-center text-center">
          <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
            {achievement.badgeUrl ? (
              <div className="relative w-16 h-16">
                <Image
                  src={achievement.badgeUrl}
                  alt={achievement.title}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                {defaultIcon}
              </div>
            )}
            
            {!achievement.unlocked && (
              <>
                <div className="absolute inset-0 bg-background/70 rounded-full flex items-center justify-center">
                  {achievement.progress > 0 ? (
                    <div className="text-xs font-medium">{achievement.progress}%</div>
                  ) : (
                    <span className="text-xl">🔒</span>
                  )}
                </div>
                
                {achievement.progress > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-primary/20">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-full" 
                        style={{ height: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <h3 className="font-medium text-sm">{achievement.title}</h3>
          
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
          
          {/* Difficulty indicator */}
          <div className="mt-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              achievement.difficulty === 'common' && "bg-muted text-muted-foreground",
              achievement.difficulty === 'uncommon' && "bg-primary/10 text-primary",
              achievement.difficulty === 'rare' && "bg-secondary/10 text-secondary-foreground",
              achievement.difficulty === 'epic' && "bg-accent/10 text-accent-foreground font-medium"
            )}>
              {achievement.difficulty}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // List layout
  return (
    <Card
      className={cardClasses}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex-shrink-0">
            {achievement.badgeUrl ? (
              <div className="relative w-12 h-12">
                <Image
                  src={achievement.badgeUrl}
                  alt={achievement.title}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">
                {defaultIcon}
              </div>
            )}
            
            {!achievement.unlocked && (
              <>
                <div className="absolute inset-0 bg-background/70 rounded-full flex items-center justify-center">
                  {achievement.progress > 0 ? (
                    <div className="text-xs font-medium">{achievement.progress}%</div>
                  ) : (
                    <span className="text-lg">🔒</span>
                  )}
                </div>
                
                {achievement.progress > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-primary/20">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-full" 
                        style={{ height: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{achievement.title}</h3>
              
              {/* Difficulty indicator */}
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                achievement.difficulty === 'common' && "bg-muted text-muted-foreground",
                achievement.difficulty === 'uncommon' && "bg-primary/10 text-primary",
                achievement.difficulty === 'rare' && "bg-secondary/10 text-secondary-foreground",
                achievement.difficulty === 'epic' && "bg-accent/10 text-accent-foreground font-medium"
              )}>
                {achievement.difficulty}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {achievement.description}
            </p>
            
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
            
            {!achievement.unlocked && achievement.progress > 0 && (
              <div className="w-full h-1.5 bg-muted rounded-full mt-2">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
