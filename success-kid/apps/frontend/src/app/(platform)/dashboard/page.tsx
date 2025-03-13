import { currentUser } from '@clerk/nextjs';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { PointsSummary } from '@/components/features/points/points-summary';
import { MarketCapTracker } from '@/components/features/market/market-cap-tracker';
import { RecentActivity } from '@/components/features/activity/recent-activity';
import { LeaderboardPreview } from '@/components/features/leaderboard/leaderboard-preview';
import { WebSocketStatus, EventSimulator } from '@/components/features/real-time';

export default async function DashboardPage() {
  const user = await currentUser();
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName || 'there'}!`}
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PointsSummary />
        <MarketCapTracker />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <div className="space-y-6">
          <LeaderboardPreview />
          <WebSocketStatus />
          <EventSimulator />
        </div>
      </div>
    </div>
  );
}
