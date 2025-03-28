'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentForm } from './CommentForm';
import { Comment } from '@/types/community';
import { 
  ArrowUp, 
  ArrowDown, 
  CornerDownRight, 
  MessageSquare, 
  Flag, 
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentListProps {
  postId: string;
  comments?: Comment[];
  sortBy?: 'top' | 'new' | 'controversial';
  isLoading?: boolean;
  className?: string;
}

export function CommentList({ 
  postId, 
  comments = [], 
  sortBy = 'top', 
  isLoading = false, 
  className = '' 
}: CommentListProps) {
  const { toast } = useToast();
  
  // Sort comments based on the selected sorting method
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'new') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'top') {
      return b.voteCount - a.voteCount;
    } else if (sortBy === 'controversial') {
      // Simple controversial algorithm: comments with votes close to zero
      return Math.abs(0 - a.voteCount) - Math.abs(0 - b.voteCount);
    }
    return 0;
  });
  
  // Handle comment voting
  const handleVote = (commentId: string, direction: 'up' | 'down') => {
    // In a real implementation, this would make an API call
    
    // Show toast for points earned
    if (direction === 'up') {
      toast({
        title: "Points earned!",
        description: "You earned 2 Success Points for upvoting a comment",
        duration: 3000,
      });
    }
  };

  // Function to render a single comment
  const renderComment = (comment: Comment) => {
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    
    const handleReplySubmit = async (content: string) => {
      // In a real implementation, this would call an API
      console.log('Reply submitted:', content);
      setIsReplying(false);
      
      // Show toast for points earned
      toast({
        title: "Points earned!",
        description: "You earned 8 Success Points for replying to a comment",
        duration: 3000,
      });
    };
    
    // Format the creation date
    const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

    return (
      <div key={comment.id} className="space-y-4">
        <div className="flex gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {comment.author.avatarUrl ? (
              <Avatar
                src={comment.author.avatarUrl}
                alt={comment.author.username}
                className="h-8 w-8"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {comment.author.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="font-medium text-sm">{comment.author.username}</h4>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            
            <div className="mt-1 text-sm whitespace-pre-line break-words">{comment.content}</div>
            
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              {/* Vote Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0",
                    comment.userVote === 'up' && "text-primary"
                  )}
                  onClick={() => handleVote(comment.id, 'up')}
                >
                  <ArrowUp size={14} />
                  <span className="sr-only">Upvote</span>
                </Button>
                <span>{comment.voteCount}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0",
                    comment.userVote === 'down' && "text-destructive"
                  )}
                  onClick={() => handleVote(comment.id, 'down')}
                >
                  <ArrowDown size={14} />
                  <span className="sr-only">Downvote</span>
                </Button>
              </div>
              
              {/* Reply Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquare size={14} />
                Reply
              </Button>
              
              {/* Report Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1"
              >
                <Flag size={14} />
                Report
              </Button>
              
              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-auto"
                  >
                    <MoreHorizontal size={14} />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem>Copy Link</DropdownMenuItem>
                  <DropdownMenuItem>Block User</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Reply Form */}
            {isReplying && (
              <div className="mt-4">
                <CommentForm
                  onSubmit={handleReplySubmit}
                  placeholder="Write a reply..."
                  autoFocus
                  minHeight={80}
                />
              </div>
            )}
            
            {/* Child Comments (Replies) */}
            {comment.childCount > 0 && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs flex items-center gap-1.5 mb-2"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  <CornerDownRight size={14} />
                  {showReplies ? 'Hide' : 'Show'} {comment.childCount} {comment.childCount === 1 ? 'reply' : 'replies'}
                </Button>
                
                {/* In a real implementation, this would fetch and display replies */}
                {showReplies && (
                  <div className="pl-4 border-l border-muted mt-2 space-y-4">
                    {/* This is placeholder for reply rendering */}
                    <div className="flex items-center justify-center py-2">
                      <span className="text-xs text-muted-foreground">
                        Replies would be loaded here
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 mt-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {sortedComments.map(comment => renderComment(comment))}
      </div>
    </div>
  );
}
