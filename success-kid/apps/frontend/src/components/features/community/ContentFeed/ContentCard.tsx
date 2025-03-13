'use client';

import React from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { useVotePost } from '@/hooks/queries/useCommunity';
import { formatDistanceToNow } from 'date-fns';

interface ContentCardProps {
  post: Post;
  isCompact?: boolean;
  onSelect?: (id: string) => void;
}

/**
 * Card component to display post content in feeds
 */
export function ContentCard({ post, isCompact = false, onSelect }: ContentCardProps) {
  const { mutate: votePost } = useVotePost();
  
  const {
    id,
    title,
    content,
    preview,
    type,
    author,
    categoryId,
    createdAt,
    commentCount,
    voteCount,
    userVote,
    tags = [],
  } = post;
  
  // Format the date
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Handle vote button click
  const handleVote = (direction: 'up' | 'down' | null) => {
    // Determine the actual direction based on current state
    const newDirection = userVote === direction ? null : direction;
    votePost({ postId: id, direction: newDirection });
  };
  
  const cardContent = (
    <div className="border rounded-lg p-6 bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Author Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
          {author.avatarUrl ? (
            <img 
              src={author.avatarUrl} 
              alt={author.username} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            author.username.substring(0, 2).toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{author.displayName || author.username}</h3>
              <p className="text-xs text-muted-foreground">{author.role || 'Community Member'}</p>
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          {/* Post Content */}
          <div className="mt-3">
            <h2 className="font-semibold text-lg">{title}</h2>
            <p className="mt-2 text-muted-foreground line-clamp-3">{preview || content}</p>
          </div>
          
          {/* Media preview for image posts */}
          {type === 'image' && post.mediaUrls && post.mediaUrls.length > 0 && !isCompact && (
            <div className="mt-3 relative pt-[56.25%] bg-muted rounded-md overflow-hidden">
              <img 
                src={post.mediaUrls[0]} 
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Stats */}
          <div className="mt-4 flex space-x-6 text-sm text-muted-foreground">
            {/* Upvote */}
            <button 
              className={`flex items-center hover:text-foreground ${userVote === 'up' ? 'text-primary font-medium' : ''}`}
              onClick={() => handleVote('up')}
              aria-label="Upvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
              </svg>
              {voteCount}
            </button>
            
            {/* Comments */}
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 45.46 45.46 0 003.551-.414c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A45.448 45.448 0 0010 2zm4.5 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
              </svg>
              {commentCount}
            </span>
            
            {/* Share */}
            <button className="flex items-center hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M13 4.5a2.5 2.5 0 11.5 0H13v5.5a2.5 2.5 0 002.5 2.5H19v-1.5a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5V4.5zm-11 10a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5H7v-5.5a.5.5 0 01.5-.5h3a.5.5 0 00.5-.5V1.5a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5H1.5a2.5 2.5 0 01.5 0H7v5.5a.5.5 0 01-.5.5H3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 01.5.5V19H1.5a.5.5 0 010-1H12v-5.5a.5.5 0 01.5-.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5V4.5z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // If onSelect is provided, make the card clickable directly
  if (onSelect) {
    return (
      <div onClick={() => onSelect(id)} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }
  
  // Otherwise, wrap in a link to the post detail page
  return (
    <Link href={`/community/post/${id}`} className="block">
      {cardContent}
    </Link>
  );
}

export default ContentCard;
