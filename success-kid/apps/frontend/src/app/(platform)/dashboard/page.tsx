'use client';

import { useRouter } from 'next/navigation';
import { useNavigationStore } from '@/store/useNavigationStore';
import { MiniRedemptionWidget } from '@/components/features/redemption';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const toggleSidebar = useNavigationStore(state => state.toggleSidebar);
  const sidebarExpanded = useNavigationStore(state => state.sidebarExpanded);
  
  const handleRedemptionClick = () => {
    router.push('/points/redeem');
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back to Success Kid Community!
          </p>
        </div>
        
        {/* Sidebar toggle button for easy demonstration */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
        >
          {sidebarExpanded ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-14.5-14.5z" clipRule="evenodd" />
                <path d="M4 1.5H3a2 2 0 00-2 2v13a2 2 0 002 2h1a2 2 0 002-2v-13a2 2 0 00-2-2z" />
              </svg>
              Collapse Sidebar
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M3 4h14v2H3V4zM3 9h14v2H3V9zM3 14h14v2H3v-2z" />
              </svg>
              Expand Sidebar
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Main Content Area - 8 columns on desktop */}
        <div className="md:col-span-8 space-y-6">
          {/* Example content, not implemented */}
          <Card className="overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
            <CardHeader className="bg-white dark:bg-gray-800 pb-0">
              <CardTitle className="text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 pt-6">
              <div className="border-l-4 border-primary pl-4 py-3 mb-4">
                <p className="text-gray-700 dark:text-gray-300">Welcome to the enhanced dashboard with the new sidebar navigation! Try expanding and collapsing the sidebar to see the smooth animations.</p>
              </div>
              <div className="space-y-4">
                <ActivityItem 
                  title="New Community Post"
                  description="User JohnDoe posted 'Getting started with Success Kid tokens'"
                  time="2 hours ago"
                  type="post"
                />
                <ActivityItem 
                  title="Achievement Unlocked" 
                  description="You've earned the 'First Steps' achievement!"
                  time="Yesterday"
                  type="achievement"
                />
                <ActivityItem 
                  title="Points Earned" 
                  description="You received 50 points for your daily login streak"
                  time="Yesterday"
                  type="points"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
            <CardHeader className="bg-white dark:bg-gray-800 pb-0">
              <CardTitle className="text-xl">Community Feed</CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 pt-6">
              <div className="space-y-4">
                <FeedItem 
                  author="Alice"
                  content="Just reached level 5! The journey has been amazing so far!"
                  time="3 hours ago"
                  likes={24}
                  comments={5}
                />
                <FeedItem 
                  author="Bob"
                  content="Has anyone checked the new market milestone? We're almost there!"
                  time="5 hours ago"
                  likes={18}
                  comments={12}
                />
                <FeedItem 
                  author="Carol"
                  content="Created a tutorial on connecting your wallet safely. Check it out in the guides section!"
                  time="Yesterday"
                  likes={42}
                  comments={8}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar - 4 columns on desktop */}
        <div className="md:col-span-4 space-y-6">
          {/* Mini Redemption Widget Integration */}
          <MiniRedemptionWidget 
            onFullRedemptionClick={handleRedemptionClick}
          />
          
          {/* Leaderboard Widget */}
          <Card className="overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
            <CardHeader className="bg-white dark:bg-gray-800 pb-2">
              <CardTitle className="text-lg">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 pt-2">
              <div className="space-y-2">
                <LeaderboardItem rank={1} username="CryptoKing" points={8750} />
                <LeaderboardItem rank={2} username="TokenMaster" points={7200} />
                <LeaderboardItem rank={3} username="BlockchainPro" points={6840} />
                <LeaderboardItem rank={4} username="MemeCreator" points={5920} />
                <LeaderboardItem rank={5} username="You" points={4785} isYou={true} />
              </div>
              <button className="mt-4 w-full text-center text-sm text-primary hover:text-primary-600 font-medium">
                View Full Leaderboard
              </button>
            </CardContent>
          </Card>
          
          {/* Market Updates Widget */}
          <Card className="overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
            <CardHeader className="bg-white dark:bg-gray-800 pb-2">
              <CardTitle className="text-lg">Market Updates</CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.0042</p>
                  <p className="text-sm text-green-600 font-medium">+5.24% (24h)</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                  <p className="text-sm font-medium">Market Cap: $842K</p>
                </div>
              </div>
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Price chart placeholder</p>
              </div>
              <button className="mt-4 w-full text-center text-sm text-primary hover:text-primary-600 font-medium">
                View Market Details
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper components for the dashboard

function ActivityItem({ title, description, time, type }: { 
  title: string, 
  description: string, 
  time: string,
  type: 'post' | 'achievement' | 'points'
}) {
  const getIcon = () => {
    switch (type) {
      case 'post':
        return (
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'achievement':
        return (
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M9.156 2.262a.75.75 0 01.688 0l7.5 4.33a.75.75 0 010 1.296l-7.5 4.33a.75.75 0 01-.688 0l-7.5-4.33a.75.75 0 010-1.296l7.5-4.33z" clipRule="evenodd" />
              <path d="M3.3 7.613l6.026 3.507c.433.25.93.25 1.363 0L16.7 7.6a.75.75 0 011.03.728v8.535a.75.75 0 01-.361.636A12.002 12.002 0 009 19.736a12.002 12.002 0 00-8.369-2.242.75.75 0 01-.361-.636V8.341a.75.75 0 011.03-.728z" />
            </svg>
          </div>
        );
      case 'points':
        return (
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
            </svg>
          </div>
        );
    }
  };
  
  return (
    <div className="flex items-start space-x-3 py-2">
      {getIcon()}
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

function FeedItem({ author, content, time, likes, comments }: { 
  author: string, 
  content: string, 
  time: string,
  likes: number,
  comments: number
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center space-x-3 mb-2">
        <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{author}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{time}</p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-2">{content}</p>
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
          </svg>
          <span className="text-xs">{likes}</span>
        </button>
        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">{comments}</span>
        </button>
      </div>
    </div>
  );
}

function LeaderboardItem({ rank, username, points, isYou = false }: { 
  rank: number, 
  username: string, 
  points: number,
  isYou?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-md ${isYou ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
      <div className="flex items-center space-x-3">
        <span className={`text-sm font-medium ${isYou ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
          #{rank}
        </span>
        <span className={`font-medium ${isYou ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
          {username}
        </span>
      </div>
      <span className={`text-sm ${isYou ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {points.toLocaleString()} pts
      </span>
    </div>
  );
}
