/**
 * Thread View Page
 * 
 * Displays a thread with its replies
 */
import React from 'react';
import { ThreadView } from '@/components/features/community';
import { RealTimeUpdates } from '@/components/features/community/RealTimeUpdates';
import { Metadata } from 'next';

interface ThreadViewPageProps {
  params: {
    id: string;
  };
}

// Generate metadata based on the thread id
export async function generateMetadata({ params }: ThreadViewPageProps): Promise<Metadata> {
  // This would ideally fetch the thread title from the API, but for now we'll use a generic title
  return {
    title: `Thread | Success Kid Community`,
    description: 'View and participate in this discussion thread.',
  };
}

export default function ThreadViewPage({ params }: ThreadViewPageProps) {
  const { id } = params;
  
  return (
    <div className="container mx-auto py-8">
      <ThreadView threadId={id} />
      <RealTimeUpdates threadId={id} />
    </div>
  );
}
