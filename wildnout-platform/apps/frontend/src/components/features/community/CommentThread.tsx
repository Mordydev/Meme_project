'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CommentEditor } from './CommentEditor';
import { useAuth } from '@clerk/nextjs';

interface Comment {
  id: string;
  contentId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  text: string;
  parentCommentId?: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

interface CommentThreadProps {
  contentId: string;
  initialComments?: Comment[];
  maxDepth?: number;
}

export function CommentThread({
  contentId,
  initialComments = [],
  maxDepth = 3,
}: CommentThreadProps) {
  const { isSignedIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loading, setLoading] = useState(initialComments.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Organize comments into a tree structure
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments by ID
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into a tree structure
    flatComments.forEach(comment => {
      const mappedComment = commentMap.get(comment.id);
      if (!mappedComment) return;

      if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent && parent.replies) {
          parent.replies.push(mappedComment);
        }
      } else {
        rootComments.push(mappedComment);
      }
    });

    return rootComments;
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Replace with actual API call when implementing
      // For this demonstration, we'll just use mock data
      const response = await fetch(`/api/content/${contentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      // Assuming the API returns the content with comments included
      setComments(organizeComments(data.data.comments || []));
    } catch (err) {
      setError('Failed to load comments. Please try again.');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    } else {
      setComments(organizeComments(initialComments));
    }
  }, [initialComments]);

  const handleAddComment = async (text: string, parentCommentId?: string) => {
    try {
      const response = await fetch(`/api/content/${contentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          parentCommentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      
      // Refresh comments
      fetchComments();
      
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const [showReplyEditor, setShowReplyEditor] = useState(false);
    const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

    return (
      <div 
        key={comment.id}
        className={`comment ${depth > 0 ? 'ml-6 mt-3' : 'mt-4'} ${
          depth > 0 ? 'border-l-2 border-zinc-700 pl-4' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <Avatar
            src={comment.author.avatarUrl || undefined}
            alt={comment.author.username}
            fallback={comment.author.username.charAt(0).toUpperCase()}
            className="h-8 w-8"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Link 
                href={`/profile/${comment.author.id}`}
                className="font-medium text-hype-white hover:text-battle-yellow transition-colors"
              >
                {comment.author.username}
              </Link>
              <span className="text-xs text-zinc-400">{formattedDate}</span>
            </div>
            
            <div className="mt-1 mb-2 text-zinc-300 whitespace-pre-line">
              {comment.text}
            </div>
            
            <div className="flex gap-3 text-xs">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-auto px-2 py-1 text-zinc-400 hover:text-hype-white"
              >
                ❤️ {comment.likes > 0 ? comment.likes : ''}
              </Button>
              
              {depth < maxDepth && isSignedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-zinc-400 hover:text-hype-white"
                  onClick={() => setShowReplyEditor(!showReplyEditor)}
                >
                  Reply
                </Button>
              )}
            </div>
            
            {showReplyEditor && (
              <div className="mt-3">
                <CommentEditor
                  contentId={contentId}
                  parentCommentId={comment.id}
                  onSubmit={handleAddComment}
                  onCancel={() => setShowReplyEditor(false)}
                />
              </div>
            )}
            
            {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
              <div className="replies">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
            
            {comment.replies && comment.replies.length > 0 && depth >= maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-battle-yellow hover:text-battle-yellow/80"
                onClick={() => {/* Navigate to full thread view */}}
              >
                View more replies...
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="comments-container space-y-6">
      {isSignedIn && (
        <div className="comment-editor">
          <h3 className="text-lg font-medium text-hype-white mb-3">Leave a comment</h3>
          <CommentEditor contentId={contentId} onSubmit={handleAddComment} />
        </div>
      )}
      
      <div className="comments">
        <h3 className="text-lg font-medium text-hype-white mb-3">
          Comments ({loading ? '...' : comments.length})
        </h3>
        
        {loading && (
          <div className="py-4 text-center">
            <div className="animate-pulse text-battle-yellow">Loading comments...</div>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-center">
            <p className="text-roast-red mb-2">{error}</p>
            <Button onClick={fetchComments} variant="secondary" size="sm">
              Try Again
            </Button>
          </div>
        )}
        
        {!loading && comments.length === 0 && (
          <div className="py-4 text-center bg-zinc-800/30 rounded-lg">
            <p className="text-zinc-400">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
        
        {comments.map(comment => renderComment(comment))}
      </div>
    </div>
  );
}
