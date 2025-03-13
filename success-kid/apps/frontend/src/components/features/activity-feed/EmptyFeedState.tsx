'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Star, Activity } from 'lucide-react';

export interface EmptyFeedStateProps {
  feedType: 'global' | 'following' | 'personal';
}

export function EmptyFeedState({ feedType }: EmptyFeedStateProps) {
  const renderContent = () => {
    switch (feedType) {
      case 'following':
        return {
          icon: <Users className="h-12 w-12 text-muted-foreground mb-4" />,
          title: 'Follow More Users',
          description: "Your following feed is empty! Follow other community members to see their activity here.",
          action: <Link href="/community/explore" className="text-primary hover:underline">Explore Community</Link>
        };
      case 'personal':
        return {
          icon: <Activity className="h-12 w-12 text-muted-foreground mb-4" />,
          title: 'No Activity Yet',
          description: "Your personal feed is empty! Start engaging with the community to see your activity here.",
          action: <Link href="/community" className="text-primary hover:underline">Explore Community</Link>
        };
      default:
        return {
          icon: <Star className="h-12 w-12 text-muted-foreground mb-4" />,
          title: 'Nothing to Show...Yet!',
          description: "There's no activity to display at the moment. Check back soon or adjust your filters.",
          action: <button 
            onClick={() => window.location.reload()} 
            className="text-primary hover:underline"
          >
            Refresh Feed
          </button>
        };
    }
  };

  const content = renderContent();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-muted/20 rounded-lg">
      {content.icon}
      <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{content.description}</p>
      {content.action}
    </div>
  );
}
