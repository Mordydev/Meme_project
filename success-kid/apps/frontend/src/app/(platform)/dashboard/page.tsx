import { Suspense } from 'react';
import { auth } from '@clerk/nextjs'; // Assuming Clerk's auth() is available

// --- Placeholders for Data Fetchers ---
// These functions need to be implemented, likely fetching data from your backend API
// Example: async function getUserPoints(userId: string) { const res = await fetch(...); return res.json(); }
async function getUserPoints(userId: string): Promise<any> { console.warn("Placeholder: getUserPoints called"); return { total: 1234, history: [{ amount: 100, source: 'test', date: new Date() }] }; }
async function getUserPointsHistory(userId: string, limit: number): Promise<any[]> { console.warn("Placeholder: getUserPointsHistory called"); return [{ amount: 100, source: 'test', date: new Date() }]; }
async function getUserAchievements(userId: string): Promise<any[]> { console.warn("Placeholder: getUserAchievements called"); return [{ id: 'ach1', name: 'First Post', unlocked: true }]; }
// --- End Placeholders ---

// --- Component Imports ---
import { PointsOverview } from '@/components/rewards/PointsOverview';
import { TransactionHistory } from '@/components/rewards/TransactionHistory';
import { AchievementGallery } from '@/components/rewards/AchievementGallery';
import { SkeletonLoader } from '@/components/ui/skeleton-loader'; // Assuming this exists and works as a basic skeleton

// --- Loading State Components ---
// Simple placeholders for loading states
const LoadingPoints = () => <SkeletonLoader className="h-24 w-full" />; // Example usage
const LoadingAchievements = () => <SkeletonLoader className="h-48 w-full" />; // Example usage

// --- Main Dashboard Page Component ---
export default async function DashboardPage() {
  // Fetch user ID - this requires the page to be a Server Component implicitly
  // Ensure Clerk is set up correctly for App Router
  const { userId } = auth();

  // Handle case where user is not authenticated (though middleware should prevent this)
  if (!userId) {
    // Optionally redirect or show an error message
    // redirect('/sign-in'); // Example redirect
    return <div>Please sign in to view your dashboard.</div>;
  }

  return (
    // Using Tailwind classes for layout based on plan's structure
    <div className="container mx-auto py-6 px-4"> {/* Added padding */}
      <h1 className="text-2xl font-bold mb-6">Your Dashboard</h1>

      {/* Grid layout for top sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Points Summary */}
        <div className="md:col-span-1 bg-card p-4 rounded-lg shadow"> {/* Added card styling */}
          {/* Points Overview (Summary & Chart handled by PointsSummaryAndChart) */}
          {/* Removed redundant h3 titles as PointsOverview likely has its own */}
          <Suspense fallback={<LoadingPoints />}>
            {/* Server Component fetching and rendering points overview */}
            <PointsSummaryAndChart userId={userId} />
          </Suspense>
        </div>

        {/* Empty div or adjust grid span if PointsSummaryAndChart covers both */}
         <div className="md:col-span-2"> {/* Keep structure or adjust */}
            {/* Content previously in PointsChartContainer is now in PointsSummaryAndChart */}
         </div>
      </div>

      {/* Recent Activity Section */}
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="mb-8 bg-card p-4 rounded-lg shadow"> {/* Added card styling */}
        <Suspense fallback={<LoadingPoints />}>
          {/* Server Component fetching and rendering history */}
          <RecentPointsHistory userId={userId} />
        </Suspense>
      </div>

      {/* Achievements Section */}
      <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
      <div className="bg-card p-4 rounded-lg shadow"> {/* Added card styling */}
        <Suspense fallback={<LoadingAchievements />}>
          {/* Server Component fetching and rendering achievements */}
          <UserAchievements userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}

// --- Server Components for Data Fetching ---

// This component fetches points data and passes it to PointsOverview
async function PointsSummaryAndChart({ userId }: { userId: string }) {
  // Fetch points data once for both summary and chart parts within PointsOverview
  const pointsData = await getUserPoints(userId); // Contains balance, trends, etc.
  // PointsOverview expects balance and dashboardData (which might include trends/caps)
  // We pass isLoading=false because data fetching is complete here.
  return <PointsOverview balance={pointsData?.total || 0} dashboardData={pointsData} isLoading={false} />;
}

// This component fetches recent history and renders TransactionHistory
// Note: TransactionHistory fetches its own data via Zustand, so this might be redundant
//       or could be used to pass initial data if needed. For now, just render it.
async function RecentPointsHistory({ userId }: { userId: string }) {
  // const pointsHistory = await getUserPointsHistory(userId, 5); // Fetching here might be optional
  // TransactionHistory uses Zustand store, so no props needed typically
  return <TransactionHistory />;
}

// This component fetches achievements and passes them to AchievementGallery
async function UserAchievements({ userId }: { userId: string }) {
  const allAchievements = await getUserAchievements(userId); // Fetch all achievement definitions/status
  // Filter unlocked achievements - AchievementGallery might do this internally, but providing both is safer
  const unlocked = allAchievements.filter(a => a.unlocked);
  // Pass achievements, unlockedAchievements, and isLoading=false
  return <AchievementGallery achievements={allAchievements} unlockedAchievements={unlocked} isLoading={false} />;
}
