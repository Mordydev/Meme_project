'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, isOnboarded, user, profile } = useAuth();
  
  // Redirect to onboarding if the user is not onboarded
  useEffect(() => {
    if (isLoaded && isSignedIn && !isOnboarded) {
      router.push('/onboarding');
    }
  }, [isLoaded, isSignedIn, isOnboarded, router]);
  
  // Show loading spinner while auth state is loading
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If not signed in or not onboarded, show nothing (redirect will happen)
  if (!isSignedIn || !isOnboarded) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {profile?.displayName || user?.firstName}!</h1>
        <p className="text-gray-600">Your personal Success Kid dashboard</p>
      </header>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Activity Summary Card */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Your Activity</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Current Level:</span>
              <span className="font-semibold">{profile?.level || 1}</span>
            </div>
            <div className="flex justify-between">
              <span>Success Points:</span>
              <span className="font-semibold">100</span>
            </div>
            <div className="flex justify-between">
              <span>Achievements:</span>
              <span className="font-semibold">{profile?.achievements?.length || 0}</span>
            </div>
          </div>
        </Card>
        
        {/* Recent Achievements Card */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Achievements</h2>
          {profile?.achievements && profile.achievements.length > 0 ? (
            <div className="space-y-3">
              {profile.achievements.map((achievementId) => (
                <div key={achievementId} className="flex items-center rounded-lg bg-gray-50 p-2">
                  <div className="mr-3 h-10 w-10 rounded-full bg-primary/10"></div>
                  <div>
                    <div className="font-medium">
                      {achievementId === 'first_steps' && 'First Steps'}
                      {achievementId === 'profile_complete' && 'Identity Established'}
                      {achievementId === 'connect_wallet' && 'Wallet Warrior'}
                      {achievementId === 'first_post' && 'Content Creator'}
                    </div>
                    <div className="text-sm text-gray-500">Recently unlocked</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No achievements yet. Start exploring to earn some!</p>
          )}
        </Card>
        
        {/* Wallet Status Card */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Wallet Status</h2>
          {profile?.wallet?.connected ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="text-xs">{profile.wallet.address?.substring(0, 6)}...{profile.wallet.address?.substring(profile.wallet.address.length - 4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified:</span>
                <span className="font-semibold">{profile.wallet.isVerified ? 'Yes' : 'No'}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-gray-500">You haven't connected a wallet yet.</p>
              <button className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-600">
                Connect Wallet
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
