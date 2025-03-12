import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ContentFeed } from '@/components/features/content/content-feed';
import { CreatePostButton } from '@/components/features/content/create-post-button';
import { ContentFilter } from '@/components/features/content/content-filter';

export default async function CommunityPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Community"
        description="Engage with other Success Kid community members"
        action={<CreatePostButton />}
      />
      
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <ContentFilter />
        </div>
        <div className="md:col-span-9">
          <ContentFeed />
        </div>
      </div>
    </div>
  );
}
