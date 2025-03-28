'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * LeaderboardSection - Placeholder component for the rewards page
 * This replaces the original leaderboard component that was removed
 */
export function LeaderboardSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Leaderboards</CardTitle>
        <CardDescription>See how you rank against other community members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium">Leaderboards Coming Soon</h3>
          <p className="text-neutral-500 max-w-md">
            We're working on a new and improved leaderboard experience for the community.
            Check back soon for updates!
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.href = '/rewards'}
          >
            Return to Rewards
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 