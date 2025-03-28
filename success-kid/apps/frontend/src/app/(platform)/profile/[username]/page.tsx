'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ProfileHeader } from '@/components/features/profile';
import { ProfileContent } from '@/components/features/profile/profile-content';
import { useProfileData } from '@/hooks/profile/use-profile-data';
import { useFollowUser } from '@/hooks/profile/use-follow-user';

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = params;
  const router = useRouter();
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const { followUser, unfollowUser } = useFollowUser();
  
  // State for user data - would be fetched from API in real implementation
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Mock stats - would be fetched from API in real implementation
  const stats = {
    points: 950,
    achievements: 6,
    posts: 15,
    followers: 8,
    following: 24
  };
  
  // Check if this is the current user's profile
  useEffect(() => {
    if (!isUserLoaded) return;
    
    if (currentUser?.username === username) {
      // Redirect to own profile page
      router.push('/profile');
      return;
    }
    
    // Simulate API call to fetch user data
    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock user data - would be fetched from API
        setUser({
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          username: username,
          firstName: 'User',
          lastName: username,
          imageUrl: null,
          publicMetadata: {
            bio: `This is ${username}'s profile. This would be fetched from the API in a real implementation.`
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        // Mock following status - would be fetched from API
        setIsFollowing(Math.random() > 0.5);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [username, currentUser?.username, isUserLoaded, router]);
  
  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };
  
  // Show loading state while fetching user data
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse">Loading user profile...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        stats={stats}
        isOwnProfile={false}
        onFollow={handleFollow}
        isFollowing={isFollowing}
      />
      
      <ProfileContent userId={user.id} />
    </div>
  );
}
