'use client';

import React, { useState } from 'react';
import { useComments } from '@/hooks/queries/useCommunity';
import { CommentList } from './CommentList';
import { CommentEditor } from './CommentEditor';
import { CommentActions } from './CommentActions';
import { CommentSort } from '@/types';

interface CommentContainerProps {
  postId: string;
  initialSort?: CommentSort;
  maxDepth?: number;
}

/**
 * Container component for the entire comment section
 */
export function CommentContainer({ 
  postId, 
  initialSort = 'top',
  maxDepth = 5
}: CommentContainerProps) {
  const [sortOrder, setSortOrder] = useState<CommentSort>(initialSort);
  
  // Fetch comments for the post
  const { 
    data, 
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useComments({ 
    postId, 
    sort: sortOrder,
  });
  
  // Handle sort order changes
  const handleSortChange = (newSort: CommentSort) => {
    if (newSort !== sortOrder) {
      setSortOrder(newSort);
    }
  };
  
  // Handle loading more replies for a specific parent comment
  const handleLoadMoreReplies = async (parentId: string) => {
    // In a real implementation, this would fetch replies specifically for this parent
    // For this example, we'll just refetch all comments
    await refetch();
  };
  
  // Extract comments from data
  const comments = data?.comments || [];
  const commentCount = data?.pagination?.total || 0;
  
  return (
    <div id="comments-section" className="mt-8">
      {/* Comment section header with sort controls */}
      <CommentActions 
        sortOrder={sortOrder} 
        onSortChange={handleSortChange}
        commentCount={commentCount}
      />
      
      {/* New comment editor */}
      <div className="mb-8">
        <CommentEditor postId={postId} />
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="py-8 text-center">
          <p className="text-alert">Failed to load comments. Please try again.</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Comments list */}
      {!isLoading && !isError && (
        <CommentList 
          comments={comments}
          postId={postId}
          sortOrder={sortOrder}
          loadMoreReplies={handleLoadMoreReplies}
          isLoadingMore={isFetchingNextPage}
        />
      )}
      
      {/* Load more comments button */}
      {hasNextPage && !isLoading && !isError && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more comments'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CommentContainer;
