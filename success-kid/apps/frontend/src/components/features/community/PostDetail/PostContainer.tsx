'use client';

import React from 'react';
import { usePost, usePostsFeed } from '@/hooks/queries/useCommunity';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostActions } from './PostActions';
import { RelatedContent } from './RelatedContent';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PostContainerProps {
  postId: string;
  initialData?: any;
  onBack?: () => void;
}

/**
 * Container component for post details including related content
 */
export function PostContainer({ postId, initialData, onBack }: PostContainerProps) {
  const router = useRouter();
  
  // Fetch post details
  const { 
    data: post, 
    isLoading, 
    isError 
  } = usePost(postId);
  
  // Fetch related posts (from same category)
  const { 
    data: relatedPostsData,
  } = usePostsFeed({
    categoryId: post?.categoryId,
    feed: 'latest',
    limit: 4
  });
  
  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Error state
  if (isError || !post) {
    return (
      <div className="py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-alert/60 mx-auto mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <h3 className="text-lg font-medium mb-2">Post not found</h3>
        <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been removed.</p>
        <Link href="/community" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Back to Community
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {/* Back button */}
      <button 
        onClick={handleBack} 
        className="flex items-center text-muted-foreground hover:text-foreground mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Community
      </button>
      
      {/* Post header */}
      <PostHeader post={post} />
      
      {/* Post content */}
      <PostContent post={post} />
      
      {/* Post actions */}
      <PostActions post={post} />
      
      {/* Comments section placeholder */}
      <div id="comments-section" className="mt-8">
        <h2 className="text-xl font-bold mb-4">Comments ({post.commentCount})</h2>
        <div className="text-muted-foreground text-center py-8">
          <p>Comments section will be implemented here</p>
        </div>
      </div>
      
      {/* Related posts */}
      {relatedPostsData?.posts && (
        <RelatedContent 
          posts={relatedPostsData.posts} 
          categoryId={post.categoryId}
          currentPostId={postId}
        />
      )}
    </div>
  );
}

export default PostContainer;
