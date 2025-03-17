/**
 * Real-time Updates Component
 * 
 * Demonstrates WebSocket integration with real-time updates
 * for points, notifications, and activities
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, useWebSocketMessage } from '@/lib/websocket/use-websocket';

/**
 * Notification type
 */
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

/**
 * Points update type
 */
interface PointsUpdate {
  amount: number;
  source: string;
  timestamp: string;
}

/**
 * Connection status component
 */
const ConnectionStatus = ({ isConnected }: { isConnected: boolean }) => (
  <div className="flex items-center gap-2 mb-4">
    <div 
      className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
    />
    <span className="text-sm font-medium">
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  </div>
);

/**
 * Notification item component
 */
const NotificationItem = ({ notification, onMarkRead }: { 
  notification: Notification; 
  onMarkRead: (id: string) => void;
}) => (
  <div className={`p-3 mb-2 rounded-lg border ${notification.read ? 'bg-neutral-50' : 'bg-blue-50 border-blue-200'}`}>
    <div className="flex justify-between">
      <h4 className="font-medium">{notification.title}</h4>
      <span className="text-xs text-neutral-500">
        {new Date(notification.timestamp).toLocaleTimeString()}
      </span>
    </div>
    <p className="text-sm mt-1">{notification.message}</p>
    {!notification.read && (
      <button 
        onClick={() => onMarkRead(notification.id)}
        className="text-xs text-blue-600 mt-2 hover:underline"
      >
        Mark as read
      </button>
    )}
  </div>
);

/**
 * Points history item component
 */
const PointsHistoryItem = ({ update }: { update: PointsUpdate }) => (
  <div className="flex justify-between items-center p-2 border-b">
    <div>
      <span className={`font-medium ${update.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {update.amount >= 0 ? '+' : ''}{update.amount} points
      </span>
      <div className="text-xs text-neutral-500">{update.source}</div>
    </div>
    <div className="text-xs text-neutral-500">
      {new Date(update.timestamp).toLocaleTimeString()}
    </div>
  </div>
);

/**
 * Real-time updates component that demonstrates WebSocket integration
 */
export default function RealTimeUpdates() {
  // WebSocket state
  const { 
    isConnected, 
    connectionState, 
    connect, 
    disconnect, 
    subscribe, 
    unsubscribe,
    subscriptions,
    send
  } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host}/ws`,
    {
      autoConnect: true,
      channels: ['user:notifications', 'public:announcements', 'market:updates'],
      reconnect: {
        enabled: true,
        maxAttempts: 10
      }
    }
  );
  
  // Component state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsUpdate[]>([]);
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Handle points update message
  useWebSocketMessage('points.awarded', (data: PointsUpdate) => {
    // Update points history
    setPointsHistory(prev => [data, ...prev].slice(0, 10));
    
    // Update points balance
    setPointsBalance(prev => prev + data.amount);
    
    // Create notification
    const notification: Notification = {
      id: `points-${Date.now()}`,
      type: 'points',
      title: 'Points Awarded',
      message: `You earned ${data.amount} points for ${data.source}`,
      read: false,
      timestamp: data.timestamp
    };
    
    setNotifications(prev => [notification, ...prev]);
  }, []);
  
  // Handle achievement unlock message
  useWebSocketMessage('achievement.unlocked', (data) => {
    const notification: Notification = {
      id: `achievement-${Date.now()}`,
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: `You unlocked the "${data.achievement.name}" achievement!`,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [notification, ...prev]);
  }, []);
  
  // Handle notification message
  useWebSocketMessage('notification.new', (data) => {
    const notification: Notification = {
      id: data.id || `notification-${Date.now()}`,
      type: data.type || 'system',
      title: data.title || 'New Notification',
      message: data.message,
      read: false,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    setNotifications(prev => [notification, ...prev]);
  }, []);
  
  // Handle new content message
  useWebSocketMessage('content.created', (data) => {
    setActivities(prev => [{
      type: 'content',
      author: data.author,
      preview: data.preview,
      timestamp: data.timestamp
    }, ...prev].slice(0, 5));
  }, []);
  
  // Handle mark notification as read
  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Send read status to server
    send('notification:read', { id });
  }, [send]);
  
  // Toggle subscription to channel
  const toggleSubscription = useCallback((channel: string) => {
    if (subscriptions.includes(channel)) {
      unsubscribe(channel);
    } else {
      subscribe(channel);
    }
  }, [subscriptions, subscribe, unsubscribe]);
  
  // Simulate points earned (for demonstration)
  const simulatePointsEarned = useCallback(() => {
    const amount = Math.floor(Math.random() * 50) + 1;
    const sources = ['content_creation', 'comment_upvote', 'daily_login', 'streak_bonus', 'community_engagement'];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    const update: PointsUpdate = {
      amount,
      source,
      timestamp: new Date().toISOString()
    };
    
    // Update local state
    setPointsHistory(prev => [update, ...prev].slice(0, 10));
    setPointsBalance(prev => prev + amount);
    
    const notification: Notification = {
      id: `points-${Date.now()}`,
      type: 'points',
      title: 'Points Awarded',
      message: `You earned ${amount} points for ${source}`,
      read: false,
      timestamp: update.timestamp
    };
    
    setNotifications(prev => [notification, ...prev]);
  }, []);
  
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Real-time Updates</h1>
      
      {/* Connection status */}
      <div className="mb-6">
        <ConnectionStatus isConnected={isConnected} />
        
        <div className="flex gap-2">
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-3 py-1 rounded-md text-sm ${
              isConnected 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
          
          <button
            onClick={simulatePointsEarned}
            disabled={!isConnected}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50"
          >
            Simulate Points
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Active Subscriptions:</h3>
          <div className="flex flex-wrap gap-2">
            {['user:notifications', 'public:announcements', 'market:updates', 'content:new'].map(channel => (
              <button
                key={channel}
                onClick={() => toggleSubscription(channel)}
                className={`px-2 py-1 rounded-md text-xs ${
                  subscriptions.includes(channel)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">Points</h2>
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-sm text-blue-800">Current Balance</div>
            <div className="text-3xl font-bold text-blue-800">{pointsBalance}</div>
          </div>
          
          <h3 className="font-medium mb-2">Recent Points History</h3>
          <div className="border rounded-md overflow-hidden">
            {pointsHistory.length > 0 ? (
              pointsHistory.map((update, index) => (
                <PointsHistoryItem key={index} update={update} />
              ))
            ) : (
              <div className="p-4 text-center text-neutral-500 text-sm">
                No points history yet
              </div>
            )}
          </div>
        </div>
        
        {/* Notifications section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">Notifications</h2>
          <div className="space-y-2">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onMarkRead={handleMarkRead}
                />
              ))
            ) : (
              <div className="p-4 text-center text-neutral-500 text-sm border rounded-md">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Activity Feed */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-2">Activity Feed</h2>
        <div className="border rounded-md">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={index} className="p-3 border-b last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{activity.author?.displayName || 'User'}</span>
                  <span className="text-xs text-neutral-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{activity.preview || 'Created new content'}</p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-neutral-500 text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>
      
      {/* Connection Debug */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-2">Connection Info</h3>
        <div className="bg-neutral-50 p-3 rounded text-xs font-mono overflow-x-auto">
          <div>State: {connectionState}</div>
          <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
          <div>Subscriptions: {subscriptions.join(', ') || 'None'}</div>
        </div>
      </div>
    </div>
  );
}
