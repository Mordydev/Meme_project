'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { 
  PostContainer,
  CommentContainer
} from '@/components/features/community';

interface PostPageProps {
  params: {
    id: string;
  };
}

/**
 * Post Detail Page - Shows a specific community post with comments
 */
export default function PostPage({ params }: PostPageProps) {
  const router = useRouter();
  const { id } = params;
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };
  
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Post container with all details */}
        <PostContainer 
          postId={id}
          onBack={handleBack}
        />
        
        {/* Comment container */}
        <CommentContainer
          postId={id}
          initialSort="top"
        />
      </div>
    </PageLayout>
  );
}
