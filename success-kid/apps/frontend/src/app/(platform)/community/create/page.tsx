import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { CategorySelector } from '@/components/features/community';

export default function CreatePostPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Create Post"
        description="Share with the Success Kid community"
      />
      
      <Card>
        <CardContent className="p-6">
          <div className="max-w-3xl mx-auto">
            <CategorySelector 
              onChange={(categoryId) => console.log(`Selected category: ${categoryId}`)}
              className="mb-6"
            />
            
            {/* This is just a placeholder - we'll implement the full content creation interface in the next task */}
            <div className="p-12 border border-dashed rounded-md text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                Content Creation Interface Coming Soon
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                The complete post creation experience will be implemented in the next development phase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
