'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePointsStore } from '@/store/usePointsStore';

// Helper icons for categories
const categoryIcons: Record<string, React.ReactNode> = {
  content_creation: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  engagement: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  daily_login: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  achievement: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  upvotes: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  streak_bonus: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  referral: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
};

// Category display names
const categoryDisplayNames: Record<string, string> = {
  content_creation: 'Content Creation',
  engagement: 'Community Engagement',
  daily_login: 'Daily Login',
  achievement: 'Achievements',
  upvotes: 'Upvotes Received',
  streak_bonus: 'Login Streak Bonus',
  referral: 'Referrals'
};

// Cateogry descriptions
const categoryDescriptions: Record<string, string> = {
  content_creation: 'Points earned from creating posts and content',
  engagement: 'Points earned from comments and reactions',
  daily_login: 'Points earned from logging in each day',
  achievement: 'Points earned from unlocking achievements',
  upvotes: 'Points earned from upvotes on your content',
  streak_bonus: 'Bonus for consecutive daily logins',
  referral: 'Points earned from referring new users'
};

// Default caps to use if dashboardData is not available
const defaultCaps = [
  {
    category: 'content_creation',
    limit: 200,
    used: 150,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    category: 'engagement',
    limit: 150,
    used: 125,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    category: 'daily_login',
    limit: 20,
    used: 20,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    category: 'upvotes',
    limit: 100,
    used: 45,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    category: 'streak_bonus',
    limit: 100,
    used: 70,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
];

/**
 * Component to display daily earning caps and remaining opportunities
 */
export function DailyCapStatus() {
  const { dashboardData } = usePointsStore();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Prepare caps data from store or use defaults
  const capsData = dashboardData?.caps 
    ? Object.entries(dashboardData.caps).map(([category, capData]) => ({
        category,
        ...capData
      }))
    : defaultCaps;
  
  // Calculate and update time until caps reset
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (capsData.length === 0) return;
      
      // Use the first cap's reset time as reference
      const resetsAt = new Date(capsData[0].resetsAt);
      const now = new Date();
      
      if (resetsAt <= now) {
        setTimeRemaining('Resetting soon');
        return;
      }
      
      const diff = resetsAt.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };
    
    // Update immediately and then every minute
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [capsData]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Daily Earning Limits</h2>
          <p className="text-sm text-muted-foreground">
            Track your daily point earning limits and find opportunities to earn more
          </p>
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-center">
          <div className="text-xs font-medium text-muted-foreground">Caps Reset In</div>
          <div className="text-lg font-bold text-primary">{timeRemaining}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {capsData.map((cap) => (
          <CapCard key={cap.category} cap={{
            ...cap,
            title: categoryDisplayNames[cap.category] || cap.category,
            description: categoryDescriptions[cap.category] || '',
            icon: categoryIcons[cap.category] || categoryIcons['daily_login']
          }} />
        ))}
      </div>
      
      <div className="rounded-lg border bg-amber-50 p-4 text-amber-800">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-1.5 text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Unlimited Earning Opportunities</h3>
            <p className="mt-1 text-sm">
              While some activities have daily limits, referrals and certain achievements have no daily cap. 
              Invite friends to maximize your points earning potential!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CapCardProps {
  cap: {
    category: string;
    title: string;
    description: string;
    limit: number;
    used: number;
    resetsAt: string;
    icon: React.ReactNode;
  };
}

function CapCard({ cap }: CapCardProps) {
  const percentage = Math.min(100, Math.max(0, (cap.used / cap.limit) * 100));
  const remaining = cap.limit - cap.used;
  const isFull = cap.used >= cap.limit;
  
  return (
    <Card className={isFull ? 'border-gray-200 bg-gray-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-1.5 ${
              isFull ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'
            }`}>
              {cap.icon}
            </div>
            <div>
              <h3 className="font-medium">{cap.title}</h3>
              <p className="text-xs text-muted-foreground">{cap.description}</p>
            </div>
          </div>
          <div className={`text-right font-mono text-sm font-medium ${
            isFull ? 'text-gray-400' : 'text-primary'
          }`}>
            {cap.used}/{cap.limit}
          </div>
        </div>
        
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className={isFull ? 'text-gray-400' : 'text-primary'}>
              {isFull ? 'Daily Limit Reached' : `${remaining} points remaining`}
            </span>
            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div 
              className={`h-full rounded-full ${isFull ? 'bg-gray-300' : 'bg-primary'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
