'use client';

import { useRouter } from 'next/navigation';
import { MiniRedemptionWidget } from '@/components/features/redemption';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  
  const handleRedemptionClick = () => {
    router.push('/points/redeem');
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back to Success Kid Community!
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Main Content Area - 8 columns on desktop */}
        <div className="md:col-span-8 space-y-6">
          {/* Example content, not implemented */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Activity stream would appear here. (Placeholder)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Community Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Community posts would appear here. (Placeholder)
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar - 4 columns on desktop */}
        <div className="md:col-span-4 space-y-6">
          {/* Mini Redemption Widget Integration */}
          <MiniRedemptionWidget 
            onFullRedemptionClick={handleRedemptionClick}
          />
          
          {/* Other sidebar widgets */}
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Leaderboard data would appear here. (Placeholder)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Market data would appear here. (Placeholder)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
