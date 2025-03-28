import { Metadata } from 'next';
import { RewardsPage } from '@/components/rewards/RewardsPage';

export const metadata: Metadata = {
  title: 'Rewards | Success Kid Community',
  description: 'Track your Success Points, achievements, and referrals. Redeem your points for SKC tokens.'
};

/**
 * Main Rewards page - Server Component
 * Displays the user's rewards, achievements, and referrals
 * Provides a central hub for tracking and redeeming Success Points
 */
export default function RewardsPageRoute() {
  return <RewardsPage />;
}
