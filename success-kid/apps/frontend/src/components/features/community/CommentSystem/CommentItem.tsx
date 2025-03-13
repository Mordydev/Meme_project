'use client';

import React, { useState } from 'react';
import { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useVoteComment } from '@/hooks/queries/useCommunity';
import { CommentEditor } from './CommentEditor';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth: number;
  maxDepth?: number;
  children?: React.ReactNode;
  onViewMoreReplies?: (parentId: string) => void;
}

/**
 * Component to display a single comment with its replies
 */
export function CommentItem({ 
  comment, 
  postId,
  depth = 0, 
  maxDepth = 3,
  children,
  onViewMoreReplies
}: CommentItemProps) {
  const { mutate: voteComment } = useVoteComment();
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  // Extract comment data
  const { 
    id, 
    content, 
    author, 
    createdAt, 
    updatedAt, 
    voteCount, 
    userVote, 
    childCount = 0 
  } = comment;
  
  // Format the date
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const wasEdited = updatedAt && new Date(updatedAt) > new Date(createdAt);
  
  // Handle vote
  const handleVote = (direction: 'up' | 'down') => {
    const newDirection = userVote === direction ? null : direction;
    voteComment({ postId, commentId: id, direction: newDirection });
  };
  
  // Handle reply
  const handleReplySubmit = () => {
    setIsReplying(false);
    // The actual submission is handled by the CommentEditor component
  };
  
  // If comment is deleted, show placeholder
  if (isDeleted) {
    return (
      <div className="opacity-60 italic py-2 text-sm text-muted-foreground pl-3 border-l-2 border-muted">
        This comment has been deleted
      </div>
    );
  }
  
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3' : 'mt-6'}`}>
      <div className={`relative ${depth > 0 ? 'pl-4 border-l-2 border-muted' : ''}`}>
        {/* Comment header */}
        <div className="flex items-start">
          {/* Author avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs mr-3">
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
            {/* Author and timestamp */}
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="font-medium">{author.displayName || author.username}</span>
              <span className="text-xs text-muted-foreground">
                {timeAgo} {wasEdited && '(edited)'}
              </span>
            </div>
            
            {/* Comment content */}
            <div className="mt-1 text-sm">
              {content}
            </div>
            
            {/* Comment actions */}
            <div className="flex items-center mt-2 space-x-4 text-xs">
              {/* Upvote */}
              <button 
                className={`flex items-center ${userVote === 'up' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleVote('up')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                  <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                </svg>
                <span>{voteCount}</span>
              </button>
              
              {/* Reply */}
              <button 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </button>
              
              {/* Report */}
              <button className="text-muted-foreground hover:text-foreground">
                Report
              </button>
            </div>
          </div>
        </div>
        
        {/* Reply editor */}
        {isReplying && (
          <div className="mt-3 ml-11">
            <CommentEditor 
              postId={postId}
              parentId={id}
              onCancel={() => setIsReplying(false)}
              onSubmit={handleReplySubmit}
            />
          </div>
        )}
        
        {/* Child comments */}
        {children}
        
        {/* View more replies button */}
        {childCount > 0 && !children && depth < maxDepth && (
          <button 
            className="mt-2 ml-11 text-xs text-primary hover:underline flex items-center"
            onClick={() => onViewMoreReplies?.(id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            View {childCount} {childCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
        
        {/* Child count indicator when beyond max depth */}
        {childCount > 0 && depth >= maxDepth && (
          <div className="mt-2 ml-11 text-xs text-muted-foreground">
            {childCount} more {childCount === 1 ? 'reply' : 'replies'} not shown
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
