import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ProfileHeader, ProfileTabs, TabsContent } from '@/components/features/profile';
import { ProfileContent } from '@/components/features/profile/profile-content';

export default async function ProfilePage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Mock stats - would be fetched from API in real implementation
  const stats = {
    points: 1250,
    achievements: 8,
    posts: 23,
    followers: 15,
    following: 42
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Profile"
        description="Manage your account and view your activity"
      />
      
      <ProfileHeader
        user={user}
        stats={stats}
        isOwnProfile={true}
        onEditProfile={() => {}}
      />
      
      <ProfileContent userId={user.id} />
    </div>
  );
}
