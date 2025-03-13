'use client';

import { useEffect } from 'react';
import { usePointsStore } from '@/store/usePointsStore';
import { PointsDashboard } from '@/components/features/points/PointsDashboard';
import { PointsNotification } from '@/components/features/points/PointsNotification';
import { Spinner } from '@/components/ui/Spinner';

export default function PointsPage() {
  const { fetchBalance, isLoading, error } = usePointsStore();
  
  // Fetch points data when the page loads
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <h2 className="text-lg font-semibold">Error Loading Points Data</h2>
        <p>{error.message}</p>
        <button 
          onClick={() => fetchBalance()}
          className="mt-2 rounded-md bg-red-100 px-4 py-2 font-medium text-red-600 hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="mb-6 text-3xl font-bold">Success Points Dashboard</h1>
      <PointsDashboard />
      
      {/* Points Notification System */}
      <PointsNotification position="bottom-right" />
    </div>
  );
}
