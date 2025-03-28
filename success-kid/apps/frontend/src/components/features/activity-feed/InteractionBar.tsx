'use client';

import React, { useState } from 'react';
import { MessageSquare, Share2, Bookmark, BookmarkCheck, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractionCounts, UserInteractions, InteractionType } from '@/types/activity-feed';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface InteractionBarProps {
  itemId: string;
  itemType: string;
  interactions: InteractionCounts;
  userInteractions?: UserInteractions;
  onInteract: (itemId: string, type: InteractionType, value?: any) => void;
  className?: string;
  compactMode?: boolean;
}

export function InteractionBar({
  itemId,
  itemType,
  interactions,
  userInteractions = { voted: null, saved: false, commented: false },
  onInteract,
  className = '',
  compactMode = false
}: InteractionBarProps) {
  const [actionInProgress, setActionInProgress] = useState<InteractionType | null>(null);
  
  // Handler for vote action
  const handleVote = (direction: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (actionInProgress === 'vote') return;
    
    setActionInProgress('vote');
    
    // If already voted in this direction, clear vote
    const voteValue = userInteractions.voted === direction ? null : direction;
    
    // Call parent handler
    onInteract(itemId, 'vote', voteValue);
    
    // Clear action state after a short delay
    setTimeout(() => {
      setActionInProgress(null);
    }, 500);
  };
  
  // Handler for comment action
  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (actionInProgress === 'comment') return;
    
    setActionInProgress('comment');
    onInteract(itemId, 'comment');
    
    setTimeout(() => {
      setActionInProgress(null);
    }, 500);
  };
  
  // Handler for save action
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (actionInProgress === 'save') return;
    
    setActionInProgress('save');
    onInteract(itemId, 'save');
    
    setTimeout(() => {
      setActionInProgress(null);
    }, 500);
  };
  
  // Handler for share action
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (actionInProgress === 'share') return;
    
    setActionInProgress('share');
    onInteract(itemId, 'share');
    
    setTimeout(() => {
      setActionInProgress(null);
    }, 500);
  };
  
  // Determine button sizes based on compact mode
  const iconSize = compactMode ? 14 : 16;
  const textClass = compactMode ? 'text-xs' : 'text-sm';
  
  return (
    <div className={cn("flex items-center", className)}>
      {/* Vote Controls */}
      <TooltipProvider>
        <div className="flex items-center space-x-1 mr-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                className={cn(
                  "p-1 hover:bg-muted rounded transition-colors",
                  userInteractions.voted === 'up' && "text-primary",
                  actionInProgress === 'vote' && "opacity-70"
                )}
                onClick={(e) => handleVote('up', e)}
                disabled={actionInProgress === 'vote'}
                aria-label="Upvote"
              >
                <ArrowUp size={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upvote</p>
            </TooltipContent>
          </Tooltip>
          
          <span className={cn("font-medium min-w-[2ch] text-center", textClass)}>
            {interactions.votes}
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                className={cn(
                  "p-1 hover:bg-muted rounded transition-colors",
                  userInteractions.voted === 'down' && "text-alert",
                  actionInProgress === 'vote' && "opacity-70"
                )}
                onClick={(e) => handleVote('down', e)}
                disabled={actionInProgress === 'vote'}
                aria-label="Downvote"
              >
                <ArrowDown size={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Downvote</p>
            </TooltipContent>
          </Tooltip>
        </div>
      
        {/* Comment Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className={cn(
                "flex items-center space-x-1 text-muted-foreground hover:text-foreground mr-4",
                userInteractions.commented && "text-primary",
                actionInProgress === 'comment' && "opacity-70"
              )}
              onClick={handleComment}
              disabled={actionInProgress === 'comment'}
              aria-label="Comments"
            >
              <MessageSquare size={iconSize} />
              <span className={textClass}>{interactions.comments}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Comments</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Save Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className={cn(
                "mr-4 text-muted-foreground hover:text-foreground transition-colors",
                userInteractions.saved && "text-primary",
                actionInProgress === 'save' && "opacity-70"
              )}
              onClick={handleSave}
              disabled={actionInProgress === 'save'}
              aria-label={userInteractions.saved ? "Unsave" : "Save"}
            >
              {userInteractions.saved ? <BookmarkCheck size={iconSize} /> : <Bookmark size={iconSize} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{userInteractions.saved ? "Unsave" : "Save"}</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Share Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className={cn(
                "ml-auto text-muted-foreground hover:text-foreground transition-colors",
                actionInProgress === 'share' && "opacity-70"
              )}
              onClick={handleShare}
              disabled={actionInProgress === 'share'}
              aria-label="Share"
            >
              <Share2 size={iconSize} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
