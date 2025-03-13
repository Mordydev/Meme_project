'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReferralStore, ReferredUser } from '@/store/useReferralStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, timeAgo } from '@/lib/utils';

interface ReferralsListProps {
  className?: string;
  limit?: number;
  showPagination?: boolean;
}

/**
 * Component to display the list of users referred by the current user
 */
export function ReferralsList({
  className,
  limit = 5,
  showPagination = false
}: ReferralsListProps) {
  const { referrals, isLoading } = useReferralStore();
  const { fetchReferredUsers } = useReferralStore();
  
  const [status, setStatus] = useState<'all' | 'pending' | 'active' | 'converted'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'points' | 'activity'>('date');
  const [page, setPage] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    active: 0,
    converted: 0
  });

  // Calculate counts for each status
  useEffect(() => {
    if (referrals.length > 0) {
      const counts = {
        all: referrals.length,
        pending: referrals.filter(user => user.status === 'pending').length,
        active: referrals.filter(user => user.status === 'active').length,
        converted: referrals.filter(user => user.status === 'converted').length
      };
      setStatusCounts(counts);
    }
  }, [referrals]);

  // Fetch referred users when mounted or filters change
  useEffect(() => {
    fetchReferredUsers(status, sortBy, limit, page * limit);
  }, [fetchReferredUsers, status, sortBy, limit, page]);

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Your Referred Users</h3>
        
        <div className="flex">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-neutral-300 rounded-md px-2 py-1"
          >
            <option value="date">Latest</option>
            <option value="points">Points</option>
            <option value="activity">Activity</option>
          </select>
        </div>
      </div>
      
      {/* Status tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        <StatusTab 
          label="All" 
          count={statusCounts.all} 
          isActive={status === 'all'} 
          onClick={() => setStatus('all')}
        />
        <StatusTab 
          label="Pending" 
          count={statusCounts.pending} 
          isActive={status === 'pending'} 
          onClick={() => setStatus('pending')}
        />
        <StatusTab 
          label="Active" 
          count={statusCounts.active} 
          isActive={status === 'active'} 
          onClick={() => setStatus('active')}
        />
        <StatusTab 
          label="Converted" 
          count={statusCounts.converted} 
          isActive={status === 'converted'} 
          onClick={() => setStatus('converted')}
        />
      </div>
      
      {/* User list */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-lg border border-neutral-200">
              <div className="h-10 w-10 bg-neutral-200 animate-pulse rounded-full mr-3"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded"></div>
                <div className="h-3 w-32 bg-neutral-200 animate-pulse rounded"></div>
              </div>
              <div className="h-6 w-16 bg-neutral-200 animate-pulse rounded"></div>
            </div>
          ))
        ) : referrals.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <p>No referred users found</p>
            <p className="text-sm mt-1">Share your referral code to start building your network</p>
          </div>
        ) : (
          referrals.map((user, index) => (
            <UserListItem 
              key={user.userId} 
              user={user} 
              index={index}
            />
          ))
        )}
      </div>
      
      {/* Pagination */}
      {showPagination && referrals.length > 0 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          
          <span className="text-sm text-neutral-500">
            Page {page + 1}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={referrals.length < limit}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}

interface StatusTabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function StatusTab({ label, count, isActive, onClick }: StatusTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-sm whitespace-nowrap",
        isActive 
          ? "bg-primary text-white" 
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      )}
    >
      {label} ({count})
    </button>
  );
}

interface UserListItemProps {
  user: ReferredUser;
  index: number;
}

function UserListItem({ user, index }: UserListItemProps) {
  // Determine status badge styling
  const getStatusBadge = () => {
    switch (user.status) {
      case 'pending':
        return <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-600">Pending</span>;
      case 'active':
        return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Active</span>;
      case 'converted':
        return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Converted</span>;
      default:
        return null;
    }
  };
  
  return (
    <motion.div
      className="flex items-center p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div className="flex-shrink-0 mr-3">
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.username} 
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{user.username}</div>
        <div className="text-xs text-neutral-500">
          Joined {timeAgo(new Date(user.registeredAt))}
          {user.lastActive && ` • Last active ${timeAgo(new Date(user.lastActive))}`}
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        {getStatusBadge()}
        
        {user.pointsGenerated > 0 && (
          <div className="text-xs text-neutral-500 mt-1">
            {user.pointsGenerated} points
          </div>
        )}
      </div>
    </motion.div>
  );
}
