import { Metadata } from 'next';
import { currentUser } from '@clerk/nextjs';
import { notFound } from 'next/navigation';
import { 
  ProfileHeader, 
  AchievementShowcase, 
  ContentGallery 
} from '@/components/features/profile';

// Dynamic metadata
export async function generateMetadata({ 
  params 
}: { 
  params: { username: string }
}): Promise<Metadata> {
  // Fetch user profile for metadata
  const profileResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/profile/${params.username}`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  if (!profileResponse.ok) {
    return {
      title: 'User Not Found | Wild 'n Out',
      description: 'This user profile could not be found',
    };
  }
  
  const profileData = await profileResponse.json();
  const { profile } = profileData.data;
  
  return {
    title: `${profile.displayName} (@${profile.username}) | Wild 'n Out`,
    description: profile.bio || `Check out ${profile.displayName}'s profile on Wild 'n Out`,
  };
}

// User profile page component
export default async function UserProfilePage({ 
  params 
}: { 
  params: { username: string }
}) {
  // Get current user if logged in
  const user = await currentUser();
  
  // Fetch user profile from API
  const profileResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/profile/${params.username}`,
    {
      headers: user ? {
        Authorization: `Bearer ${process.env.API_SECRET}`,
        'x-user-id': user.id,
      } : {},
      next: { revalidate: 60 }, // Revalidate every minute
    }
  );
  
  // Handle not found
  if (!profileResponse.ok) {
    if (profileResponse.status === 404) {
      notFound();
    }
    throw new Error('Failed to fetch profile');
  }
  
  const profileData = await profileResponse.json();
  const { 
    profile, 
    achievements, 
    isCurrentUser,
    isFollowing 
  } = profileData.data;
  
  // Client-side handlers are implemented as separate components
  const followUserAction = async () => {
    'use server';
    const followResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${profile.userId}/follow`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.API_SECRET}`,
          'x-user-id': user?.id || '',
        },
      }
    );
    
    if (!followResponse.ok) {
      throw new Error('Failed to follow user');
    }
  };
  
  const unfollowUserAction = async () => {
    'use server';
    const unfollowResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${profile.userId}/follow`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.API_SECRET}`,
          'x-user-id': user?.id || '',
        },
      }
    );
    
    if (!unfollowResponse.ok) {
      throw new Error('Failed to unfollow user');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile sidebar */}
        <div className="w-full md:w-1/3">
          <ProfileHeader
            profile={profile}
            isCurrentUser={isCurrentUser}
            isFollowing={isFollowing}
            onFollow={user ? followUserAction : undefined}
            onUnfollow={user ? unfollowUserAction : undefined}
          />
        </div>
        
        {/* Main content */}
        <div className="w-full md:w-2/3">
          {/* Achievements section */}
          <AchievementShowcase 
            achievements={achievements}
            highlightCount={6}
            showLocked={false}
          />
          
          {/* Content section */}
          <ContentGallery 
            userId={profile.userId} 
            initialContent={profile.content}
          />
        </div>
      </div>
    </div>
  );
}
