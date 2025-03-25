'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageCircle, Share2, Flag } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { CommentList } from '@/components/features/community/CommentList';
import { CommentForm } from '@/components/features/community/CommentForm';
import { ContentDetailView } from '@/components/features/community/ContentDetailView';
import { RealTimeUpdates } from '@/components/features/community/RealTimeUpdates';
import { useContentDetails } from '@/hooks/useContentDetails';

interface PostDetailPageProps {
  params: {
    postId: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = params;
  const { content, isLoading, error, comments, loadComments, addComment, handleVote } = useContentDetails(postId);
  const [sortComments, setSortComments] = useState<'newest' | 'oldest' | 'popular'>('newest');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/community">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft size={16} />
            Back to Community
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-4 text-red-500">
              <h3 className="text-lg font-medium">Error loading content</h3>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : content ? (
        <>
          <Card>
            <CardContent className="p-6">
              <ContentDetailView 
                content={content} 
                onVote={handleVote} 
              />
              
              <div className="mt-6 pt-6 border-t flex gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <MessageCircle size={16} />
                  {comments?.length || 0} Comments
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <Share2 size={16} />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 ml-auto">
                  <Flag size={16} />
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Comments</h2>
            
            <Card>
              <CardContent className="p-6">
                <CommentForm onSubmit={addComment} />
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">{comments?.length || 0} comments</div>
              <select
                value={sortComments}
                onChange={(e) => setSortComments(e.target.value as any)}
                className="text-sm border rounded p-1"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="popular">Most popular</option>
              </select>
            </div>
            
            <CommentList 
              comments={comments || []} 
              sortBy={sortComments} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* Real-time updates for post interaction */}
          <RealTimeUpdates 
            postId={postId}
            onNewComment={() => loadComments()}
            onEngagementUpdate={(data) => {
              if (data.postId === postId) {
                // This would refresh engagement metrics in a real implementation
              }
            }}
          />
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-4">
              <h3 className="text-lg font-medium text-muted-foreground">
                Content not found
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                The post you're looking for might have been removed or doesn't exist
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
