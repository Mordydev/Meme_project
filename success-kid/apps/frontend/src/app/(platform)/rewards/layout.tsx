import { ReactNode } from 'react';

/**
 * Layout for the Rewards section
 * Provides common structure for all reward-related pages
 */
export default function RewardsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {children}
    </div>
  );
}
