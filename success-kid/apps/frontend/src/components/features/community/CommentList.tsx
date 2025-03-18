'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { CommentForm } from './CommentForm';
import { Comment } from '@/types/community';
import { ThumbsUp, CornerDownRight, MessageSquare, Flag } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
  sortBy: 'newest' | 'oldest' | 'popular';
  isLoading?: boolean;
  className?: string;
}

export function CommentList({ comments, sortBy, isLoading = false, className = '' }: CommentListProps) {
  // Sort comments based on the selected sorting method
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'popular') {
      return (b.votes?.upvotes || 0) - (a.votes?.upvotes || 0);
    }
    return 0;
  });

  // Function to render a single comment
  const renderComment = (comment: Comment) => {
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    
    const handleReplySubmit = async (replyData: any) => {
      // In a real implementation, this would call an API
      console.log('Reply submitted:', replyData);
      setIsReplying(false);
    };

    return (
      <div key={comment.id} className="space-y-4">
        <div className="flex gap-3">
          <Avatar
            src={comment.author.avatar}
            alt={comment.author.name}
            className="h-8 w-8 rounded-full flex-shrink-0 mt-1"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="font-medium text-sm">{comment.author.name}</h4>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.author.isVerified && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary">Verified</Badge>
              )}
            </div>
            
            <div className="mt-1 text-sm">{comment.text}</div>
            
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs">
                <ThumbsUp size={14} />
                {comment.votes?.upvotes || 0}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquare size={14} />
                Reply
              </Button>
              
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs">
                <Flag size={14} />
                Report
              </Button>
            </div>
            
            {isReplying && (
              <div className="mt-4">
                <CommentForm
                  onSubmit={handleReplySubmit}
                  parentId={comment.id}
                  placeholder="Write a reply..."
                  autoFocus
                />
              </div>
            )}
            
            {/* Render child comments if they exist */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    <CornerDownRight size={14} className="mr-1" />
                    {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </Button>
                </div>
                
                {showReplies && (
                  <div className="pl-6 border-l space-y-4 mt-4">
                    {comment.replies.map(reply => renderComment(reply))}
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
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {sortedComments.map(comment => (
            <React.Fragment key={comment.id}>
              {renderComment(comment)}
              {comment !== sortedComments[sortedComments.length - 1] && (
                <hr className="my-6" />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
