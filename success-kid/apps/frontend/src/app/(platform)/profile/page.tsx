import { currentUser } from '@clerk/nextjs';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ProfileDetails } from '@/components/features/profile/profile-details';
import { UserActivity } from '@/components/features/profile/user-activity';
import { UserAchievements } from '@/components/features/profile/user-achievements';
import { WalletConnection } from '@/components/features/wallet/wallet-connection';

export default async function ProfilePage() {
  const user = await currentUser();
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Profile"
        description="Manage your account and view your activity"
      />
      
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <ProfileDetails user={user} />
          <WalletConnection />
        </div>
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <UserAchievements />
          <UserActivity />
        </div>
      </div>
    </div>
  );
}
