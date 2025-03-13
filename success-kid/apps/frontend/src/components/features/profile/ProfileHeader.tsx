'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { UserProfile } from '@/store/useUserStore';
import Image from 'next/image';

export interface UserStats {
  pointsBalance: number;
  leaderboardRank?: number;
  postsCount: number;
  achievementsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface ProfileHeaderProps {
  user: UserProfile;
  stats: UserStats;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditProfile?: () => void;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
  className?: string;
}

/**
 * ProfileHeader - Displays user identity and key metrics
 * 
 * @component
 * @param user - User profile data
 * @param stats - User statistics
 * @param isOwnProfile - Whether the current user is viewing their own profile
 * @param isFollowing - Whether the current user is following this profile
 * @param onEditProfile - Handler for edit profile action
 * @param onFollow - Handler for follow action
 * @param onUnfollow - Handler for unfollow action
 * @param className - Additional CSS classes
 */
export function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  isFollowing = false,
  onEditProfile,
  onFollow,
  onUnfollow,
  className
}: ProfileHeaderProps) {
  const [followLoading, setFollowLoading] = useState(false);
  
  const handleFollowAction = async () => {
    if (!onFollow || !onUnfollow) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow();
      } else {
        await onFollow();
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Format date to readable string (e.g., "Joined April 2023")
  const formatJoinDate = (date: Date) => {
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };
  
  // Create initials from display name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className={cn("flex flex-col md:flex-row items-start gap-6 border-b pb-8", className)}>
      {/* Avatar with badges */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold overflow-hidden">
          {user.avatar ? (
            <Image 
              src={user.avatar} 
              alt={`${user.displayName}'s avatar`}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(user.displayName)
          )}
        </div>
        
        {/* Level badge */}
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full shadow-md">
          Level {user.level}
        </div>
      </div>
      
      <div className="flex-1">
        {/* User identity */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <p className="text-muted-foreground">@{user.username} • {formatJoinDate(new Date(user.joinedAt))}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.title && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  {user.title}
                </span>
              )}
              {user.wallet?.connected && (
                <span className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full">
                  Token Holder
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          {isOwnProfile ? (
            <Button 
              onClick={onEditProfile} 
              className="md:self-start"
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              onClick={handleFollowAction}
              disabled={followLoading}
              variant={isFollowing ? "outline" : "default"}
              className="md:self-start"
            >
              {followLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
        </div>
        
        {/* Bio */}
        {user.bio && (
          <p className="mt-4 max-w-2xl">
            {user.bio}
          </p>
        )}
        
        {/* User metrics */}
        <div className="mt-6 flex flex-wrap gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-2xl font-bold">{stats.pointsBalance.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Success Points</p>
          </motion.div>
          
          {stats.leaderboardRank && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-2xl font-bold">#{stats.leaderboardRank}</p>
              <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-2xl font-bold">{stats.postsCount}</p>
            <p className="text-sm text-muted-foreground">Posts Created</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-2xl font-bold">{stats.achievementsCount}</p>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-2xl font-bold">{stats.followersCount}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-2xl font-bold">{stats.followingCount}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
