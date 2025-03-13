import React from 'react';
import { DashboardHeader } from '@/components/layout';
import { PageLayout } from '@/components/layout';
import { CategoryBrowser, FeedContainer } from '@/components/features/community';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Community Page - The main hub for user-generated content and discussions
 */
export default function CommunityPage() {
  return (
    <PageLayout>
      <DashboardHeader 
        title="Community" 
        description="Connect with fellow Success Kid members"
        action={
          <Link href="/community/create">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Create Post
            </button>
          </Link>
        }
      />
      
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Category sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-6">
            <h2 className="font-medium mb-3">Categories</h2>
            <div className="bg-card border rounded-lg p-4">
              <CategoryBrowser 
                onSelect={(categoryId) => console.log('Selected category:', categoryId)}
              />
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          <FeedContainer 
            initialFeedType="latest"
            onCreatePost={() => window.location.href = '/community/create'}
          />
        </div>
      </div>
    </PageLayout>
  );
}
