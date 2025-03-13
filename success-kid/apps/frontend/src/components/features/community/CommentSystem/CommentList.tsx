'use client';

import React, { useState } from 'react';
import { Comment, CommentSort } from '@/types';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  postId: string;
  sortOrder: CommentSort;
  loadMoreReplies?: (parentId: string) => Promise<void>;
  isLoadingMore?: boolean;
}

/**
 * Handles rendering a threaded list of comments
 */
export function CommentList({ 
  comments, 
  postId,
  sortOrder, 
  loadMoreReplies,
  isLoadingMore = false
}: CommentListProps) {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // Check if a comment is expanded
  const isExpanded = (commentId: string) => !!expandedComments[commentId];
  
  // Handle expanding/collapsing replies
  const toggleReplies = async (parentId: string) => {
    if (expandedComments[parentId]) {
      // Collapse
      const updated = { ...expandedComments };
      delete updated[parentId];
      setExpandedComments(updated);
    } else {
      // Expand and load replies if needed
      if (loadMoreReplies) {
        await loadMoreReplies(parentId);
      }
      setExpandedComments({
        ...expandedComments,
        [parentId]: true
      });
    }
  };
  
  // Organize comments into a threaded structure
  const rootComments = comments.filter(comment => !comment.parentId);
  
  // Create a map of parent ID to child comments
  const commentsByParentId: Record<string, Comment[]> = {};
  comments.forEach(comment => {
    if (comment.parentId) {
      if (!commentsByParentId[comment.parentId]) {
        commentsByParentId[comment.parentId] = [];
      }
      commentsByParentId[comment.parentId].push(comment);
    }
  });
  
  // Recursive function to render comment thread
  const renderCommentThread = (comment: Comment, depth: number, maxDepth: number = 5) => {
    const childComments = commentsByParentId[comment.id] || [];
    const hasChildren = childComments.length > 0;
    const canShowChildren = depth < maxDepth && hasChildren && isExpanded(comment.id);
    
    return (
      <CommentItem
        key={comment.id}
        comment={comment}
        postId={postId}
        depth={depth}
        maxDepth={maxDepth}
        onViewMoreReplies={toggleReplies}
      >
        {canShowChildren && (
          <div className="ml-3 mt-3 space-y-3">
            {childComments.map(childComment => renderCommentThread(childComment, depth + 1, maxDepth))}
          </div>
        )}
      </CommentItem>
    );
  };
  
  // If no comments, show empty state
  if (rootComments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {rootComments.map(comment => renderCommentThread(comment, 0))}
      
      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="py-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

export default CommentList;
