import { Metadata } from 'next';
import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { 
  ProfileHeader, 
  AchievementShowcase, 
  ContentGallery 
} from '@/components/features/profile';

export const metadata: Metadata = {
  title: 'Profile | Wild 'n Out',
  description: 'View and manage your Wild 'n Out profile and achievements',
};

export default async function ProfilePage() {
  // Get current user from Clerk
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  // Fetch user profile with achievements from our API
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/profile`, {
    headers: {
      Authorization: `Bearer ${process.env.API_SECRET}`,
      'x-user-id': user.id,
    },
    next: { revalidate: 60 }, // Revalidate every minute
  });
  
  if (!response.ok) {
    // If profile doesn't exist yet, redirect to onboarding
    if (response.status === 404) {
      redirect('/onboarding');
    }
    
    throw new Error('Failed to fetch profile');
  }
  
  const profileData = await response.json();
  const { profile, achievements } = profileData.data;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile sidebar */}
        <div className="w-full md:w-1/3">
          <ProfileHeader
            profile={profile}
            isCurrentUser={true}
            isFollowing={false}
          />
        </div>
        
        {/* Main content */}
        <div className="w-full md:w-2/3">
          {/* Achievements section */}
          <AchievementShowcase 
            achievements={achievements}
            highlightCount={6}
            showLocked={true}
          />
          
          {/* Content section */}
          <ContentGallery 
            userId={user.id} 
            initialContent={profile.content}
          />
        </div>
      </div>
    </div>
  );
}
