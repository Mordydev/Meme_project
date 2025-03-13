import { Suspense } from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import PointsDashboard from '@/components/features/points/PointsDashboard';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'Success Points | Dashboard',
  description: 'Track your Success Points earnings, redemptions, and opportunities',
};

async function getPointsDashboardData(userId: string) {
  // This would be implemented with an actual API call
  // For now, we'll return mock data that matches the expected format
  return {
    currentBalance: 2450,
    lifetimeEarned: 3750,
    redeemed: 1000,
    dailyEarned: 350,
    breakdown: [
      { category: 'content', amount: 1250, percentage: 33.3 },
      { category: 'engagement', amount: 950, percentage: 25.3 },
      { category: 'achievements', amount: 750, percentage: 20.0 },
      { category: 'referrals', amount: 800, percentage: 21.4 }
    ],
    transactions: [
      {
        id: 'tx_123',
        amount: 50,
        type: 'earned',
        source: 'content',
        description: 'Created a new post',
        timestamp: '2025-03-12T14:35:00Z',
        referenceId: 'post_456',
        referenceType: 'post'
      },
      {
        id: 'tx_124',
        amount: 15,
        type: 'earned',
        source: 'engagement',
        description: 'Received upvotes on comment',
        timestamp: '2025-03-12T12:22:00Z',
        referenceId: 'comment_789',
        referenceType: 'comment'
      },
      {
        id: 'tx_125',
        amount: 100,
        type: 'earned',
        source: 'achievements',
        description: 'Unlocked "Content Creator" achievement',
        timestamp: '2025-03-11T16:45:00Z',
        referenceId: 'achievement_101',
        referenceType: 'achievement'
      }
    ],
    caps: {
      'content': {
        limit: 200,
        used: 150,
        resetsAt: '2025-03-13T00:00:00Z'
      },
      'engagement': {
        limit: 150,
        used: 125,
        resetsAt: '2025-03-13T00:00:00Z'
      }
    }
  };
}

export default async function PointsDashboardPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const dashboardData = await getPointsDashboardData(userId);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-display-md mb-6 font-display">Success Points Dashboard</h1>
      
      <Suspense fallback={<div className="flex justify-center p-12"><Spinner size="lg" /></div>}>
        <PointsDashboard 
          userId={userId} 
          initialData={dashboardData} 
        />
      </Suspense>
    </div>
  );
}
