'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { PostFeedItem, InteractionType } from '@/types/activity-feed';
import { cn } from '@/lib/utils';
import { InteractionBar } from '../InteractionBar';

export interface PostRendererProps {
  item: PostFeedItem;
  isCompact?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export function PostRenderer({ item, isCompact = false, onAction }: PostRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  
  const handleInteraction = (itemId: string, type: InteractionType, value?: any) => {
    onAction?.(type, value);
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const postUrl = `/community/post/${item.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4">
      <Link href={postUrl}>
        <CardContent className="p-4">
          {/* Post Header */}
          <div className="flex items-center mb-3">
            <Link 
              href={`/profile/${item.author.username}`}
              className="flex items-center gap-2" 
              onClick={(e) => e.stopPropagation()}
            >
              {item.author.avatarUrl ? (
                <Image 
                  src={item.author.avatarUrl} 
                  alt={item.author.username} 
                  width={32} 
                  height={32} 
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  {item.author.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-sm hover:underline">{item.author.username}</p>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </Link>
          </div>
          
          {/* Post Title and Content */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            
            {!isCompact && item.content && (
              <p className={cn(
                "text-muted-foreground mb-3", 
                !isExpanded && item.content.length > 240 ? "line-clamp-3" : ""
              )}>
                {item.content}
              </p>
            )}
            
            {!isCompact && item.content && item.content.length > 240 && (
              <button 
                className="text-xs text-primary font-medium hover:underline mb-3"
                onClick={toggleExpand}
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
          
          {/* Engagement Controls using InteractionBar */}
          <div className="mt-2 pt-2 border-t">
            <InteractionBar 
              itemId={item.id}
              itemType={item.type}
              interactions={item.interactions}
              userInteractions={item.userInteractions}
              onInteract={handleInteraction}
              compactMode={isCompact}
            />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
