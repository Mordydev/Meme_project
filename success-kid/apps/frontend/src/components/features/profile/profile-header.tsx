import React from 'react';
import Image from 'next/image';
import { UserResource } from '@clerk/types';
import { ProfileHeaderActions } from './profile-header-actions';

// Types
export interface UserStats {
  points: number;
  achievements: number;
  posts: number;
  followers: number;
  following: number;
}

export interface ProfileHeaderProps {
  user: UserResource | null;
  stats: UserStats;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onFollow?: () => Promise<void>;
  isFollowing?: boolean;
}

export function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  onEditProfile,
  onFollow,
  isFollowing = false,
}: ProfileHeaderProps) {
  return (
    <div className="w-full bg-card rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar Section */}
        <div className="relative">
          <div className="h-24 w-24 md:h-32 md:w-32 relative rounded-full overflow-hidden bg-gray-100 border-4 border-primary/20">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={`${user.firstName || 'User'}'s avatar`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 96px, 128px"
                priority
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">
                {user?.firstName?.[0] || user?.username?.[0] || '?'}
              </div>
            )}
          </div>
          
          {/* Level Badge */}
          <div className="absolute -bottom-2 -right-2 bg-secondary text-black text-xs font-bold h-8 w-8 rounded-full flex items-center justify-center border-2 border-white">
            {5 /* Level placeholder */}
          </div>
        </div>

        {/* User Identity & Stats */}
        <div className="flex-1 flex flex-col md:flex-row justify-between w-full">
          <div className="space-y-2">
            {/* Name & Username */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || 'Anonymous User'}
              </h1>
              <p className="text-muted-foreground">
                @{user?.username || user?.id?.substring(0, 8) || 'anonymous'}
              </p>
            </div>
            
            {/* Join Date */}
            <p className="text-sm text-muted-foreground">
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}
            </p>

            {/* Bio - if we have one */}
            {user?.publicMetadata?.bio && (
              <p className="text-sm mt-2 max-w-md">
                {user.publicMetadata.bio as string}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 md:mt-0 flex flex-col gap-2 items-start md:items-end">
            {user && (
              <ProfileHeaderActions 
                userId={user.id} 
                isOwnProfile={isOwnProfile} 
                isFollowing={isFollowing}
              />
            )}
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 px-2 py-4 bg-muted rounded-md">
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Points</span>
          <span className="font-bold text-lg">{stats.points.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Achievements</span>
          <span className="font-bold text-lg">{stats.achievements}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Posts</span>
          <span className="font-bold text-lg">{stats.posts}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Followers</span>
          <span className="font-bold text-lg">{stats.followers}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Following</span>
          <span className="font-bold text-lg">{stats.following}</span>
        </div>
      </div>
    </div>
  );
}
