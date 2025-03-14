'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FeedItem as FeedItemType } from './types';
import { PostRenderer } from './renderers/PostRenderer';
import { MediaRenderer } from './renderers/MediaRenderer';
import { ActivityRenderer } from './renderers/ActivityRenderer';
import { AchievementRenderer } from './renderers/AchievementRenderer';
import { InteractionBar } from './InteractionBar';
import { useFeedInteraction } from '@/hooks/queries/useActivityFeed';

interface FeedItemProps {
  item: FeedItemType;
  isCompact?: boolean;
  onSelect?: () => void;
}

/**
 * Polymorphic feed item component that renders different content types
 */
export function FeedItem({ item, isCompact = false, onSelect }: FeedItemProps) {
  const { mutate: handleInteraction, isLoading: isInteractionLoading } = useFeedInteraction();
  
  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  
  // Handle interaction
  const onInteract = (type: string, value?: any) => {
    handleInteraction({
      itemId: item.id,
      itemType: item.type,
      interaction: type as any,
      value
    });
  };
  
  // Render the appropriate content based on type
  const renderContent = () => {
    switch (item.type) {
      case 'post':
        return <PostRenderer item={item} isCompact={isCompact} />;
      case 'media':
        return <MediaRenderer item={item} isCompact={isCompact} />;
      case 'activity':
        return <ActivityRenderer item={item} isCompact={isCompact} />;
      case 'achievement':
        return <AchievementRenderer item={item} isCompact={isCompact} />;
      default:
        return <div>Unknown content type</div>;
    }
  };
  
  // Main card content
  const cardContent = (
    <div className="border rounded-lg p-6 bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Author Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm shrink-0">
          {item.author.avatarUrl ? (
            <img 
              src={item.author.avatarUrl} 
              alt={item.author.username} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            item.author.username.substring(0, 2).toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Author and Time */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{item.author.displayName || item.author.username}</h3>
              <p className="text-xs text-muted-foreground">@{item.author.username}</p>
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          {/* Content */}
          <div className="mt-3">
            {renderContent()}
          </div>
          
          {/* Interaction Bar */}
          <div className="mt-4">
            <InteractionBar
              item={item}
              onInteract={onInteract}
              isLoading={isInteractionLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  // Make the card clickable if onSelect is provided
  if (onSelect) {
    return (
      <div onClick={onSelect} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
}

export default FeedItem;
