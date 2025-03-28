'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Share2, ThumbsUp } from 'lucide-react';
import { AchievementFeedItem } from '@/types/activity-feed';
import { cn } from '@/lib/utils';

export interface AchievementRendererProps {
  item: AchievementFeedItem;
  isCompact?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export function AchievementRenderer({ item, isCompact = false, onAction }: AchievementRendererProps) {
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  
  const handleCongratulate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('congratulate');
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('share');
  };
  
  const achievementUrl = `/profile/${item.author.username}/achievements/${item.achievement.id}`;

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4",
      "bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20"
    )}>
      <Link href={achievementUrl}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Achievement Badge */}
            <div className="flex-shrink-0">
              <div className="h-14 w-14 rounded-full bg-secondary/20 flex items-center justify-center">
                {item.achievement.imageUrl ? (
                  <Image 
                    src={item.achievement.imageUrl} 
                    alt={item.achievement.name} 
                    width={44} 
                    height={44} 
                    className="rounded-full object-contain"
                  />
                ) : (
                  <Award className="h-8 w-8 text-secondary" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Achievement Header */}
              <div className="flex items-center mb-1">
                <Award className="h-4 w-4 text-secondary mr-1" />
                <span className="text-sm font-semibold text-secondary">Achievement Unlocked!</span>
              </div>
              
              {/* User Info */}
              <Link 
                href={`/profile/${item.author.username}`}
                className="flex items-center gap-2 mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                {item.author.avatarUrl ? (
                  <Image 
                    src={item.author.avatarUrl} 
                    alt={item.author.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                    {item.author.username[0].toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-sm hover:underline">{item.author.username}</span>
              </Link>
              
              {/* Achievement Info */}
              <h3 className="font-bold text-base mb-1">{item.achievement.name}</h3>
              
              {!isCompact && (
                <p className="text-sm text-muted-foreground mb-3">{item.achievement.description}</p>
              )}
              
              {/* Points Value */}
              <div className="bg-secondary/10 text-secondary px-2 py-1 rounded text-xs font-medium inline-block mb-2">
                +{item.achievement.pointsValue} Success Points
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
                
                <div className="flex gap-2">
                  {/* Congratulate Button */}
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleCongratulate}
                    aria-label="Congratulate"
                  >
                    <ThumbsUp size={16} />
                  </button>
                  
                  {/* Share Button */}
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleShare}
                    aria-label="Share"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
