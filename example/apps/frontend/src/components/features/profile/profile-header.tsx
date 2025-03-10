import { Button } from '@/components/ui/button';
import { UserProfile } from '@/types/profile';
import Link from 'next/link';
import { useState } from 'react';

interface ProfileHeaderProps {
  profile: UserProfile;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
}

export function ProfileHeader({
  profile,
  isCurrentUser,
  isFollowing,
  onFollow,
  onUnfollow,
}: ProfileHeaderProps) {
  const [followState, setFollowState] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    setIsLoading(true);
    try {
      if (followState) {
        await onUnfollow?.();
        setFollowState(false);
      } else {
        await onFollow?.();
        setFollowState(true);
      }
    } catch (error) {
      console.error('Failed to update follow status', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-zinc-800 p-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-zinc-700 mb-4 overflow-hidden">
          {profile.imageUrl ? (
            <img
              src={profile.imageUrl}
              alt={profile.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-flow-blue text-4xl text-hype-white font-bold">
              {profile.displayName.charAt(0)}
            </div>
          )}
        </div>
        <h2 className="text-xl font-display text-hype-white">{profile.displayName}</h2>
        <div className="text-zinc-400">@{profile.username}</div>
        
        {profile.stats.level > 1 && (
          <div className="mt-2 px-3 py-1 bg-battle-yellow/20 rounded-full text-xs text-battle-yellow">
            Level {profile.stats.level}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 text-center">
        <div>
          <div className="text-xl font-medium text-hype-white">
            {profile.stats.battleCount}
          </div>
          <div className="text-xs text-zinc-400">Battles</div>
        </div>
        <div>
          <div className="text-xl font-medium text-hype-white">
            {profile.stats.battleWins}
          </div>
          <div className="text-xs text-zinc-400">Wins</div>
        </div>
        <div>
          <div className="text-xl font-medium text-hype-white">
            {profile.stats.followerCount}
          </div>
          <div className="text-xs text-zinc-400">Followers</div>
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <div className="text-sm text-zinc-400">About</div>
        <div className="text-zinc-200">
          {profile.bio || 'No bio yet.'}
        </div>
      </div>

      {isCurrentUser ? (
        <Link href="/profile/edit">
          <Button
            variant="secondary"
            className="w-full"
          >
            Edit Profile
          </Button>
        </Link>
      ) : (
        <Button
          variant={followState ? 'outline' : 'primary'}
          className="w-full"
          onClick={handleFollowToggle}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : followState ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </div>
  );
}
