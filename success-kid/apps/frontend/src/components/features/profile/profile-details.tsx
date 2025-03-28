'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserResource } from '@clerk/types';
import { Button } from '@/components/ui';
import { formatJoinDate, formatDisplayName } from '@/lib/profile';

interface ProfileDetailsProps {
  user: UserResource | null;
  className?: string;
}

export function ProfileDetails({ user, className }: ProfileDetailsProps) {
  const router = useRouter();
  
  // Format join date
  const joinDate = user?.createdAt 
    ? formatJoinDate(user.createdAt)
    : 'Recently';
  
  // Handle edit profile click
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  return (
    <div className={`bg-card p-6 rounded-lg border ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Profile Details</h3>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Display Name</p>
            <p className="font-medium">{formatDisplayName(user)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">@{user?.username || 'anonymous'}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.emailAddresses[0]?.emailAddress || 'Not provided'}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Joined</p>
            <p className="font-medium">{joinDate}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Bio</p>
            <p className="text-sm">
              {user?.publicMetadata?.bio 
                ? user.publicMetadata.bio as string 
                : 'No bio provided. Add one to tell others about yourself!'}
            </p>
          </div>
        </div>
        
        <Button onClick={handleEditProfile} className="w-full mt-4">
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
