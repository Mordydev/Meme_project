import { DashboardHeader } from '@/components/layout/dashboard-header';
import { CategoryBrowser, FeedContainer, CreatePostButton } from '@/components/features/community';

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
          <CategoryBrowser 
            onSelectCategory={(categoryId) => {
              // This will be handled client-side via navigation
              console.log(`Selected category: ${categoryId}`);
            }}
          />
        </div>
        <div className="md:col-span-9">
          <FeedContainer />
        </div>
      </div>
    </div>
  );
}
