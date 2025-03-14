'use client';

import React, { useState } from 'react';
import { FeedItem, InteractionType } from './types';

interface InteractionBarProps {
  item: FeedItem;
  onInteract: (type: string, value?: any) => void;
  isLoading: boolean;
}

/**
 * Interaction bar for feed items with vote, comment, share, and save actions
 */
export function InteractionBar({ item, onInteract, isLoading }: InteractionBarProps) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  // Destructure interaction data
  const { interactions, userInteractions } = item;
  
  // Handle vote interaction
  const handleVote = (direction: 'up' | 'down' | null) => {
    // Determine the actual direction based on current state
    const newDirection = userInteractions?.voted === direction ? null : direction;
    onInteract('vote', newDirection);
  };
  
  // Handle save interaction
  const handleSave = () => {
    onInteract('save', !userInteractions?.saved);
  };
  
  // Handle comment interaction
  const handleComment = () => {
    onInteract('comment');
  };
  
  // Handle share interaction
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Success Kid - ${item.type === 'post' ? (item as any).content.title : 'Content'}`,
        text: `Check out this ${item.type} on Success Kid!`,
        url: `${window.location.origin}/content/${item.id}`
      }).catch(err => {
        console.log('Error sharing', err);
      });
    } else {
      // Fallback for browsers without share API
      onInteract('share');
    }
  };
  
  return (
    <div className="flex space-x-6 text-sm text-muted-foreground">
      {/* Upvote */}
      <button 
        className={`flex items-center hover:text-foreground transition-colors ${userInteractions?.voted === 'up' ? 'text-primary font-medium' : ''}`}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
        disabled={isLoading || actionInProgress === 'vote'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
          <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
        </svg>
        <span>
          {interactions.votes}
        </span>
      </button>
      
      {/* Comments */}
      <button
        className="flex items-center hover:text-foreground transition-colors"
        onClick={handleComment}
        aria-label="Comment"
        disabled={isLoading || actionInProgress === 'comment'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
          <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 45.46 45.46 0 003.551-.414c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A45.448 45.448 0 0010 2zm4.5 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
        <span>
          {interactions.comments}
        </span>
      </button>
      
      {/* Share */}
      <button
        className="flex items-center hover:text-foreground transition-colors"
        onClick={handleShare}
        aria-label="Share"
        disabled={isLoading || actionInProgress === 'share'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
          <path d="M13 4.5a2.5 2.5 0 11.5 0H13v5.5a2.5 2.5 0 002.5 2.5H19v-1.5a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5V4.5zm-11 10a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5H7v-5.5a.5.5 0 01.5-.5h3a.5.5 0 00.5-.5V1.5a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5H1.5a2.5 2.5 0 01.5 0H7v5.5a.5.5 0 01-.5.5H3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 01.5.5V19H1.5a.5.5 0 010-1H12v-5.5a.5.5 0 01.5-.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5V4.5z" />
        </svg>
        <span>
          Share
        </span>
      </button>
      
      {/* Save/Bookmark */}
      <button
        className={`flex items-center hover:text-foreground transition-colors ml-auto ${userInteractions?.saved ? 'text-primary font-medium' : ''}`}
        onClick={handleSave}
        aria-label={userInteractions?.saved ? "Unsave" : "Save"}
        disabled={isLoading || actionInProgress === 'save'}
      >
        {userInteractions?.saved ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z" clipRule="evenodd" />
            </svg>
            <span>Saved</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            <span>Save</span>
          </>
        )}
      </button>
    </div>
  );
}

export default InteractionBar;
