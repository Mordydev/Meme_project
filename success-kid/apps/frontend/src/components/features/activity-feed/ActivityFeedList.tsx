'use client';

import React, { memo } from 'react';
import { FeedItem, InteractionType } from '@/types/activity-feed';
import { PostRenderer } from './renderers/PostRenderer';
import { MediaRenderer } from './renderers/MediaRenderer';
import { ActivityRenderer } from './renderers/ActivityRenderer';
import { AchievementRenderer } from './renderers/AchievementRenderer';
import { LinkRenderer } from './renderers/LinkRenderer';

export interface ActivityFeedListProps {
  items: FeedItem[];
  onInteraction: (itemId: string, type: InteractionType, value?: any) => void;
  isCompact?: boolean;
}

// Get the correct renderer based on the item type
const getRenderer = (
  item: FeedItem,
  onInteraction: (itemId: string, type: InteractionType, value?: any) => void,
  isCompact?: boolean
) => {
  const handleAction = (action: string, data?: any) => {
    onInteraction(item.id, action as InteractionType, data);
  };

  switch (item.type) {
    case 'post':
      return <PostRenderer item={item} isCompact={isCompact} onAction={handleAction} />;
    case 'media':
      return <MediaRenderer item={item} isCompact={isCompact} onAction={handleAction} />;
    case 'activity':
      return <ActivityRenderer item={item} isCompact={isCompact} onAction={handleAction} />;
    case 'achievement':
      return <AchievementRenderer item={item} isCompact={isCompact} onAction={handleAction} />;
    case 'link':
      return <LinkRenderer item={item} isCompact={isCompact} onAction={handleAction} />;
    default:
      return null;
  }
};

// Memoized feed item to prevent unnecessary renders
const FeedItemMemo = memo(
  ({ item, onInteraction, isCompact }: { item: FeedItem; onInteraction: ActivityFeedListProps['onInteraction']; isCompact?: boolean }) => {
    return <div className="feed-item">{getRenderer(item, onInteraction, isCompact)}</div>;
  }
);
FeedItemMemo.displayName = 'FeedItemMemo';

export function ActivityFeedList({ items, onInteraction, isCompact }: ActivityFeedListProps) {
  return (
    <div className="activity-feed-list">
      {items.map((item) => (
        <FeedItemMemo 
          key={item.id} 
          item={item} 
          onInteraction={onInteraction} 
          isCompact={isCompact} 
        />
      ))}
    </div>
  );
}
