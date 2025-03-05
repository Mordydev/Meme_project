'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getUserById, getUserAchievements, getUserPoints } from '@/lib/supabase';
import { User, UserAchievement, UserPoints } from '@/types/supabase';

export function UserProfile() {
  const { user, isLoaded } = useUser();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!isLoaded || !user) return;

      try {
        setLoading(true);
        // Get the user data from Supabase
        const userData = await getUserById(user.id);
        if (userData) {
          setProfileData(userData as unknown as User);
          
          // Get user achievements
          const userAchievements = await getUserAchievements(user.id);
          setAchievements(userAchievements as unknown as UserAchievement[]);
          
          // Get user points
          const userPoints = await getUserPoints(user.id);
          setPoints(userPoints as unknown as UserPoints);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user, isLoaded]);

  if (!isLoaded) {
    return <div className="flex justify-center p-8">Loading user data...</div>;
  }

  if (!user) {
    return <div className="flex justify-center p-8">Please sign in to view your profile.</div>;
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading profile data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden">
            <img 
              src={profileData?.avatar_url || user.imageUrl || '/images/default-avatar.png'} 
              alt={profileData?.display_name || user.username || 'User'} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {profileData?.display_name || user.username || 'User'}
            </h2>
            <p className="text-muted-foreground">@{profileData?.username || user.username}</p>
            
            {profileData?.bio && (
              <p className="mt-2">{profileData.bio}</p>
            )}
            
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-1">
                {points?.total_points || 0} points
              </div>
              
              {profileData?.is_verified && (
                <div className="bg-blue-500/10 text-blue-500 rounded-full px-4 py-1">
                  Verified
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Achievements</h3>
        
        {achievements.length === 0 ? (
          <p className="text-muted-foreground">No achievements yet. Start participating to earn some!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="bg-background rounded-lg p-4 border border-border flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <img 
                    src={achievement.achievements?.icon_url || '/images/achievement-default.png'} 
                    alt={achievement.achievements?.name || 'Achievement'} 
                    className="w-8 h-8"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{achievement.achievements?.name || 'Achievement'}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.achievements?.description || ''}</p>
                  <p className="text-xs text-primary mt-1">+{achievement.achievements?.points_value || achievement.achievements?.points || 0} points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 