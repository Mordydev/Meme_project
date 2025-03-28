'use client';

import { PointsDashboard } from '@/components/features/points';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PointsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Success Points</h1>
          <p className="mt-2 text-muted-foreground">
            Track your points, redemption history, and how to earn more.
          </p>
        </div>
        
        <div>
          <Link href="/points/redeem">
            <Button>
              Redeem Points
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Main Content Area - 8 columns on desktop */}
        <div className="md:col-span-8 space-y-6">
          <PointsDashboard />
          
          {/* Additional points information */}
          <Card>
            <CardHeader>
              <CardTitle>How to Earn Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <h3 className="font-medium">Content Creation</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-success">+50</span>
                      <span>Creating a post</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">+15</span>
                      <span>Writing a comment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">+5</span>
                      <span>Receiving an upvote on your content</span>
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-medium">Community Engagement</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-success">+20</span>
                      <span>Daily login streak</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">+1</span>
                      <span>Upvoting quality content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">+100</span>
                      <span>Completing your profile</span>
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="font-medium">Referrals</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-success">+500</span>
                      <span>Referring a new user</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">+250</span>
                      <span>When referred user connects wallet</span>
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="font-medium">Achievements</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-success">+50-1000</span>
                      <span>Unlocking achievements based on difficulty</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">+200</span>
                      <span>Reaching a new level</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar - 4 columns on desktop */}
        <div className="md:col-span-4 space-y-6">
          {/* Redemption CTA */}
          <Card className="bg-primary-50 border-primary-100">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-primary-900">
                  Convert Points to Tokens
                </h3>
                <p className="mt-2 text-sm text-primary-700">
                  Redeem your Success Points for SKC tokens at a rate of 100 SP = 1 SKC.
                </p>
                <Link href="/points/redeem" className="mt-4 w-full">
                  <Button className="w-full">
                    Go to Redemption
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Point Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Point Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span>Daily Post Limit</span>
                  <span className="font-mono">200 SP</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Daily Comment Limit</span>
                  <span className="font-mono">150 SP</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Daily Upvote Limit</span>
                  <span className="font-mono">50 SP</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Weekly Redemption Limit</span>
                  <span className="font-mono">10,000 SP</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Minimum Redemption</span>
                  <span className="font-mono">1,000 SP</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
