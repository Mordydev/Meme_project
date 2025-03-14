'use client';

import React, { useState } from 'react';
import { PostFeedItem } from '../types';

interface PostRendererProps {
  item: PostFeedItem;
  isCompact?: boolean;
  showComments?: boolean;
}

/**
 * Renderer for post content type in feed
 */
export function PostRenderer({
  item,
  isCompact = false,
  showComments = false
}: PostRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { content } = item;
  const hasFullText = content.text.length > 240;
  const displayText = isCompact || (!isExpanded && hasFullText) 
    ? content.text.substring(0, 240) + (hasFullText ? '...' : '') 
    : content.text;
  
  return (
    <div>
      {/* Post Title */}
      {content.title && (
        <h2 className="font-semibold text-lg mb-2">{content.title}</h2>
      )}
      
      {/* Post Content */}
      <div className="text-base">
        <p className="whitespace-pre-line">{displayText}</p>
        
        {/* Expand/Collapse Button */}
        {hasFullText && !isCompact && (
          <button 
            className="text-primary text-sm mt-1 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      
      {/* Media Preview */}
      {content.hasMedia && content.mediaUrls && content.mediaUrls.length > 0 && !isCompact && (
        <div className="mt-4 relative pt-[56.25%] bg-muted rounded-md overflow-hidden">
          <img 
            src={content.mediaUrls[0]}
            alt={content.title || 'Post media'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

export default PostRenderer;
