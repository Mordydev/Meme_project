'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Share2, Bookmark, BookmarkCheck, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import { MediaFeedItem } from '@/types/activity-feed';
import { cn } from '@/lib/utils';

export interface MediaRendererProps {
  item: MediaFeedItem;
  isCompact?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export function MediaRenderer({ item, isCompact = false, onAction }: MediaRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  
  const handleVote = (direction: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('vote', direction);
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('save');
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('share');
  };
  
  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('comment');
  };

  const mediaUrl = `/community/media/${item.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4">
      <Link href={mediaUrl}>
        <CardContent className="p-4">
          {/* Media Header */}
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
          
          {/* Media Title */}
          <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
          
          {/* Media Content */}
          {!isCompact && (
            <div className="relative rounded-md overflow-hidden aspect-video mb-3 bg-muted/50">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground animate-pulse" />
                </div>
              )}
              <Image 
                src={item.mediaUrl}
                alt={item.title}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}
          
          {/* Compact Preview (Just show first image thumbnail) */}
          {isCompact && (
            <div className="flex items-center gap-2 mb-3">
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted/50">
                <Image 
                  src={item.mediaUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </div>
          )}
          
          {/* Engagement Controls */}
          <div className="flex items-center mt-2 pt-2 border-t">
            {/* Vote Controls */}
            <div className="flex items-center space-x-1 mr-4">
              <button 
                className={cn(
                  "p-1 hover:bg-muted rounded transition-colors",
                  item.userInteractions?.voted === 'up' && "text-primary"
                )}
                onClick={(e) => handleVote('up', e)}
                aria-label="Upvote"
              >
                <ArrowUp size={16} />
              </button>
              <span className="text-sm font-medium min-w-[2ch] text-center">
                {item.interactions.votes}
              </span>
              <button 
                className={cn(
                  "p-1 hover:bg-muted rounded transition-colors",
                  item.userInteractions?.voted === 'down' && "text-alert"
                )}
                onClick={(e) => handleVote('down', e)}
                aria-label="Downvote"
              >
                <ArrowDown size={16} />
              </button>
            </div>
            
            {/* Comment Button */}
            <button 
              className="flex items-center space-x-1 text-muted-foreground hover:text-foreground mr-4"
              onClick={handleCommentClick}
              aria-label="Comments"
            >
              <MessageSquare size={16} />
              <span className="text-sm">{item.interactions.comments}</span>
            </button>
            
            {/* Save Button */}
            <button 
              className={cn(
                "mr-4 text-muted-foreground hover:text-foreground transition-colors",
                item.userInteractions?.saved && "text-primary"
              )}
              onClick={handleSave}
              aria-label={item.userInteractions?.saved ? "Unsave" : "Save"}
            >
              {item.userInteractions?.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
            
            {/* Share Button */}
            <button 
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
