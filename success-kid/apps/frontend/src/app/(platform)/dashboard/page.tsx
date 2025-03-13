'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, isOnboarded, user } = useAuth();
  const router = useRouter();
  
  // Redirect to onboarding if not completed
  useEffect(() => {
    if (isLoaded && isSignedIn && !isOnboarded) {
      router.push('/onboarding');
    }
  }, [isLoaded, isSignedIn, isOnboarded, router]);
  
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-xl text-gray-400">Loading...</div>
      </div>
    );
  }
  
  if (!isSignedIn) {
    return null; // This should be handled by middleware
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info */}
      <header className="border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold text-primary">Success Kid Platform</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.firstName || user?.username}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Points Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Your Points</h2>
            <div className="mb-2 text-4xl font-bold text-primary">1,250</div>
            <p className="text-sm text-gray-500">
              Earn more points by participating in the community!
            </p>
            <button className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary-600">
              Redeem Points
            </button>
          </div>
          
          {/* Recent Activity Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  💬
                </div>
                <div>
                  <p className="font-medium">New Comment Received</p>
                  <p className="text-sm text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  🏆
                </div>
                <div>
                  <p className="font-medium">Achievement Unlocked: First Steps</p>
                  <p className="text-sm text-gray-500">35 minutes ago</p>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
              View All Activity
            </button>
          </div>
          
          {/* Community Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Community</h2>
            <p className="mb-4 text-gray-600">
              Connect with other members and join discussions.
            </p>
            <button className="mb-2 w-full rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary-600">
              Explore Topics
            </button>
            <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
              Create Post
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
