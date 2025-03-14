import React from 'react';
import { Metadata } from 'next';
import PerformanceDashboard from '@/components/features/performance/PerformanceDashboard';

export const metadata: Metadata = {
  title: 'Performance Dashboard | Success Kid Community Platform',
  description: 'Monitor and optimize platform performance',
};

/**
 * Performance Dashboard page for monitoring and optimizing platform performance
 */
export default function PerformancePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-neutral-600 mt-2">
          Monitor Core Web Vitals, component performance, and resource usage to ensure optimal platform experience.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <PerformanceDashboard />
      </div>
    </div>
  );
}
