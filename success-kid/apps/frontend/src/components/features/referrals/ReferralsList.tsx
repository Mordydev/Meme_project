'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDistanceToNow } from '@/lib/utils';
import { useReferralStore, ReferralUser } from '@/store/useReferralStore';

type ReferralStatus = 'all' | 'pending' | 'active' | 'converted';
type SortBy = 'date' | 'points' | 'activity';

interface ReferralsListProps {
  className?: string;
  onUserClick?: (userId: string) => void;
}

export function ReferralsList({ className, onUserClick }: ReferralsListProps) {
  const { 
    referrals,
    fetchReferrals,
    isReferralsLoading 
  } = useReferralStore();
  
  const [status, setStatus] = useState<ReferralStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  
  // Load referrals on mount and when filters change
  useEffect(() => {
    fetchReferrals(status !== 'all' ? status : undefined, sortBy);
  }, [fetchReferrals, status, sortBy]);
  
  // Filter and sort referrals based on current selections
  const filteredReferrals = referrals
    .filter(referral => status === 'all' || referral.status === status)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
      } else if (sortBy === 'points') {
        return b.pointsGenerated - a.pointsGenerated;
      } else if (sortBy === 'activity') {
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      }
      return 0;
    });
  
  // Get the status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Referred Users</CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Status Filter */}
            <div className="flex items-center space-x-1">
              <Button 
                variant={status === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatus('all')}
                className="text-xs"
              >
                All
              </Button>
              <Button 
                variant={status === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatus('pending')}
                className="text-xs"
              >
                Pending
              </Button>
              <Button 
                variant={status === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatus('active')}
                className="text-xs"
              >
                Active
              </Button>
              <Button 
                variant={status === 'converted' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatus('converted')}
                className="text-xs"
              >
                Converted
              </Button>
            </div>
            
            {/* Sort Options */}
            <select
              className="rounded-md border-gray-300 py-1 px-2 text-xs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              aria-label="Sort referrals by"
            >
              <option value="date">Newest</option>
              <option value="points">Points Generated</option>
              <option value="activity">Recent Activity</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isReferralsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No referrals matching the current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReferrals.map((referral) => (
              <div 
                key={referral.userId}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                onClick={() => onUserClick?.(referral.userId)}
                role={onUserClick ? 'button' : undefined}
                tabIndex={onUserClick ? 0 : undefined}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                    {referral.avatarUrl && (
                      <img 
                        src={referral.avatarUrl} 
                        alt={`${referral.username}'s avatar`} 
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{referral.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDistanceToNow(new Date(referral.registeredAt))} ago
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{referral.pointsGenerated}</p>
                    <p className="text-xs text-muted-foreground">Points Generated</p>
                  </div>
                  
                  <span className={cn("rounded-full px-2 py-1 text-xs font-medium", getStatusColor(referral.status))}>
                    {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
