'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Share2, Bookmark, BookmarkCheck, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { LinkFeedItem } from '@/types/activity-feed';
import { cn } from '@/lib/utils';

export interface LinkRendererProps {
  item: LinkFeedItem;
  isCompact?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export function LinkRenderer({ item, isCompact = false, onAction }: LinkRendererProps) {
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

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow default behavior for external links
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
          
          {/* Link Content */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            
            {!isCompact && (
              <div className="border rounded-md overflow-hidden mb-3">
                {/* Preview Image */}
                {item.previewImage && (
                  <div className="relative w-full h-40">
                    <Image 
                      src={item.previewImage} 
                      alt={item.title} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                )}
                
                {/* Link Info */}
                <div className="p-3 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-1">{item.domain}</p>
                  {item.description && (
                    <p className="text-sm line-clamp-2 mb-2">{item.description}</p>
                  )}
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline flex items-center gap-1" 
                    onClick={handleExternalClick}
                  >
                    Visit Link <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
          
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
