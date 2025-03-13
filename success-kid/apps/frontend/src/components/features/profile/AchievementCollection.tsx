'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';

export interface AchievementCollectionProps {
  userId: string;
  onAchievementSelect?: (id: string) => void;
  layout?: 'grid' | 'list';
  className?: string;
}

type AchievementCategory = 'all' | 'unlocked' | 'locked';

interface GroupedAchievements {
  unlocked: Array<Achievement & { unlocked: boolean }>;
  locked: Array<Achievement & { unlocked: boolean }>;
}

/**
 * AchievementCollection - Display user achievements with details
 * 
 * @component
 * @param userId - User identifier for fetching achievements
 * @param onAchievementSelect - Handler for achievement selection
 * @param layout - Display layout mode
 * @param className - Additional CSS classes
 */
export function AchievementCollection({
  userId,
  onAchievementSelect,
  layout = 'grid',
  className
}: AchievementCollectionProps) {
  const { getAchievements } = useAchievements();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Array<Achievement & { unlocked: boolean }>>([]);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Group achievements by unlocked status
  const groupAchievements = (achievements: Array<Achievement & { unlocked: boolean }>): GroupedAchievements => {
    return achievements.reduce((groups, achievement) => {
      if (achievement.unlocked) {
        groups.unlocked.push(achievement);
      } else {
        groups.locked.push(achievement);
      }
      return groups;
    }, { unlocked: [], locked: [] } as GroupedAchievements);
  };
  
  // Fetch achievements (using mock data from hook)
  const fetchAchievements = async () => {
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      const achievementsList = getAchievements();
      
      setAchievements(achievementsList);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Select an achievement to view details
  const handleSelectAchievement = (id: string) => {
    setSelectedAchievement(id);
    setShowDetailModal(true);
    
    if (onAchievementSelect) {
      onAchievementSelect(id);
    }
  };
  
  // Filter achievements based on category
  const getFilteredAchievements = () => {
    switch (activeCategory) {
      case 'unlocked':
        return achievements.filter(a => a.unlocked);
      case 'locked':
        return achievements.filter(a => !a.unlocked);
      case 'all':
      default:
        return achievements;
    }
  };
  
  // Load achievements on mount
  useEffect(() => {
    fetchAchievements();
  }, []);
  
  // Group achievements
  const groupedAchievements = groupAchievements(achievements);
  const filteredAchievements = getFilteredAchievements();
  
  // Get the selected achievement details
  const getSelectedAchievement = () => {
    if (!selectedAchievement) return null;
    return achievements.find(a => a.id === selectedAchievement) || null;
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Category filters */}
      <div className="flex space-x-2">
        <Button
          variant={activeCategory === 'all' ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          All ({achievements.length})
        </Button>
        <Button
          variant={activeCategory === 'unlocked' ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory('unlocked')}
        >
          Unlocked ({groupedAchievements.unlocked.length})
        </Button>
        <Button
          variant={activeCategory === 'locked' ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory('locked')}
        >
          Locked ({groupedAchievements.locked.length})
        </Button>
      </div>
      
      {/* Achievements grid/list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No achievements found</h3>
          <p className="text-muted-foreground mt-2">
            {activeCategory === 'unlocked' 
              ? 'You haven't unlocked any achievements yet.' 
              : activeCategory === 'locked'
                ? 'There are no locked achievements to display.'
                : 'There are no achievements to display.'}
          </p>
        </div>
      ) : (
        <div className={cn(
          layout === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
            : "space-y-4"
        )}>
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <AchievementCard
                achievement={achievement}
                onClick={() => handleSelectAchievement(achievement.id)}
                layout={layout}
              />
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Achievement detail modal */}
      <DetailModal
        achievement={getSelectedAchievement()}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement & { unlocked: boolean };
  onClick?: () => void;
  isSelected?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

/**
 * AchievementCard - Individual achievement display
 * 
 * @component
 * @param achievement - Achievement data
 * @param onClick - Click handler
 * @param isSelected - Selection state
 * @param layout - Display layout mode
 * @param className - Additional CSS classes
 */
function AchievementCard({
  achievement,
  onClick,
  isSelected = false,
  layout = 'grid',
  className
}: AchievementCardProps) {
  // Default icon if no image provided
  const defaultIcon = '🏆';
  
  if (layout === 'grid') {
    return (
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          !achievement.unlocked && "opacity-50",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 mb-3 relative flex items-center justify-center">
            {achievement.iconUrl ? (
              <Image
                src={achievement.iconUrl}
                alt={achievement.title}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                {defaultIcon}
              </div>
            )}
            {!achievement.unlocked && (
              <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-sm">{achievement.title}</h3>
          
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // List layout
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        !achievement.unlocked && "opacity-70",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative flex items-center justify-center flex-shrink-0">
            {achievement.iconUrl ? (
              <Image
                src={achievement.iconUrl}
                alt={achievement.title}
                width={48}
                height={48}
                className="object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">
                {defaultIcon}
              </div>
            )}
            {!achievement.unlocked && (
              <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                <span className="text-lg">🔒</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {achievement.description}
            </p>
            
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DetailModalProps {
  achievement: (Achievement & { unlocked: boolean }) | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DetailModal - Achievement detail modal
 * 
 * @component
 * @param achievement - Achievement data
 * @param isOpen - Modal open state
 * @param onClose - Close handler
 */
function DetailModal({ achievement, isOpen, onClose }: DetailModalProps) {
  if (!achievement) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-card border shadow-lg rounded-lg max-w-md w-full mx-4 overflow-hidden">
          <div className="bg-primary/10 p-6 flex justify-center">
            <div className="w-24 h-24 relative">
              {achievement.iconUrl ? (
                <Image
                  src={achievement.iconUrl}
                  alt={achievement.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-4xl">
                  🏆
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">{achievement.title}</h2>
            <p className="text-muted-foreground mb-4">{achievement.description}</p>
            
            {achievement.unlocked ? (
              <div className="bg-success/10 text-success px-3 py-2 rounded-md text-sm flex items-center">
                <span className="mr-2">✓</span>
                Unlocked {achievement.unlockedAt 
                  ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : ''}
              </div>
            ) : (
              <div className="bg-muted/30 px-3 py-2 rounded-md text-sm flex items-center">
                <span className="mr-2">🔒</span>
                Locked - Keep participating to unlock this achievement!
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
