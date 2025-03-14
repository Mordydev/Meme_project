import { DashboardHeader } from '@/components/layout/dashboard-header';
import { FeedContainer } from '@/components/features/activity-feed';

export default function ActivityFeedPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Activity Feed"
        description="Stay up to date with the latest community activity"
      />
      
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          {/* Sidebar content can be added here */}
        </div>
        <div className="md:col-span-9">
          <FeedContainer />
        </div>
      </div>
    </div>
  );
}
