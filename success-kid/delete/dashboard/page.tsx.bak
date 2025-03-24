'use client';

import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { UserSessions } from '@/components/auth/UserSessions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <SignOutButton variant="outline" />
          </div>
          <p className="text-gray-600 mt-2">Welcome back, {profile?.displayName || user?.firstName || 'there'}!</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {profile?.displayName || 'Not set'}</p>
                <p><span className="font-medium">Username:</span> {profile?.username || 'Not set'}</p>
                <p><span className="font-medium">Email:</span> {user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
                <p><span className="font-medium">Role:</span> {isAdmin ? 'Administrator' : 'User'}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Points Balance</p>
                  <p className="text-2xl font-bold">1,250</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Level</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Achievements</p>
                  <p className="text-2xl font-bold">12/50</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/achievements">View Achievements</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Quick Links Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/feed">Content Feed</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/leaderboard">Leaderboard</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/rewards">Rewards Store</Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sessions Section */}
        <div className="mt-8">
          <UserSessions />
        </div>
      </div>
    </ProtectedRoute>
  );
}
