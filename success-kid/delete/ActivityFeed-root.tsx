/**
 * Real-time Activity Feed Component
 * 
 * Displays a feed of activity events with real-time updates via WebSockets.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatDistanceToNow } from 'date-fns';
import { WebSocketStatus } from '@/components/ui/WebSocketStatus';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Heart,
  MessageSquare,
  Award,
  Zap,
  User,
  Wallet,
  Trophy
} from 'lucide-react';

/**
 * Activity item interface
 */
interface ActivityItem {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetId?: string;
  targetType?: string;
  data: any;
  createdAt: string;
  isNew?: boolean; // For animation
}

interface ActivityFeedProps {
  initialItems?: ActivityItem[];
  maxItems?: number;
  className?: string;
}

/**
 * Activity Feed Component
 */
export function ActivityFeed({
  initialItems = [],
  maxItems = 20,
  className = ''
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialItems);
  const { subscribe, status } = useWebSocket();
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Subscribe to activity events
  useEffect(() => {
    // Only subscribe when connected
    if (status.state !== 'connected') return;
    
    // Subscribe to new activity events
    const unsubscribe = subscribe('activity.new', (message) => {
      const activity = message.payload?.activity as ActivityItem;
      
      if (!activity) return;
      
      // Mark as new for animation
      activity.isNew = true;
      
      // Add to list and truncate
      setActivities(prev => {
        const updated = [activity, ...prev];
        
        // Remove 'isNew' flag after a short delay
        setTimeout(() => {
          setActivities(current => 
            current.map(item => 
              item.id === activity.id ? { ...item, isNew: false } : item
            )
          );
        }, 5000);
        
        // Limit to max items
        return updated.slice(0, maxItems);
      });
    });
    
    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [status.state, subscribe, maxItems]);
  
  // Subscribe to batch activity events
  useEffect(() => {
    // Only subscribe when connected
    if (status.state !== 'connected') return;
    
    // Subscribe to batch activity events
    const unsubscribe = subscribe('activity.batch', (message) => {
      const newActivities = message.payload?.activities as ActivityItem[];
      
      if (!Array.isArray(newActivities) || newActivities.length === 0) return;
      
      // Add to list and truncate
      setActivities(prev => {
        const updated = [
          ...newActivities.map(activity => ({ ...activity, isNew: true })),
          ...prev
        ];
        
        // Remove 'isNew' flag after a short delay
        setTimeout(() => {
          setActivities(current => 
            current.map(item => 
              newActivities.some(a => a.id === item.id) 
                ? { ...item, isNew: false } 
                : item
            )
          );
        }, 5000);
        
        // Limit to max items
        return updated.slice(0, maxItems);
      });
    });
    
    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [status.state, subscribe, maxItems]);
  
  // Handle automatic scrolling
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities.length]);
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-lg">Activity Feed</h3>
        <WebSocketStatus variant="minimal" />
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {activities.length === 0 && status.connected && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No activity yet. Stay tuned!</p>
          </div>
        )}
        
        {activities.length === 0 && !status.connected && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Connecting to real-time updates...</p>
            <WebSocketStatus variant="compact" className="mt-2 inline-flex" />
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {activities.map(activity => (
            <motion.div
              key={activity.id}
              initial={prefersReducedMotion || !activity.isNew ? 
                { opacity: 1, y: 0 } :
                { opacity: 0, y: -20 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ 
                duration: prefersReducedMotion ? 0.1 : 0.3,
                ease: 'easeOut'
              }}
              className={`p-4 rounded-lg border ${
                activity.isNew 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              } transition-colors duration-1000 ease-out`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {activity.actorAvatar ? (
                    <img 
                      src={activity.actorAvatar} 
                      alt={activity.actorName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {activity.actorName}
                    </span>
                    
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatActivityText(activity)}
                    </span>
                  </div>
                  
                  {/* Additional activity details based on type */}
                  {renderActivityDetails(activity)}
                  
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Get appropriate icon for activity type
 */
function getActivityIcon(type: string) {
  if (type.includes('point')) return <Zap size={20} />;
  if (type.includes('achievement')) return <Award size={20} />;
  if (type.includes('comment')) return <MessageSquare size={20} />;
  if (type.includes('like') || type.includes('react')) return <Heart size={20} />;
  if (type.includes('follow')) return <User size={20} />;
  if (type.includes('wallet')) return <Wallet size={20} />;
  if (type.includes('level') || type.includes('rank')) return <Trophy size={20} />;
  
  return <CheckCircle2 size={20} />;
}

/**
 * Format activity text based on type
 */
function formatActivityText(activity: ActivityItem): string {
  switch (activity.type) {
    case 'points.awarded':
      return `earned ${activity.data.amount} points`;
    
    case 'achievement.unlocked':
      return `unlocked achievement "${activity.data.name}"`;
    
    case 'content.created':
      return `created a new post`;
    
    case 'content.commented':
      return `commented on a post`;
    
    case 'content.reaction':
      return `reacted to a post`;
    
    case 'user.levelUp':
      return `reached level ${activity.data.newLevel}`;
    
    case 'wallet.connected':
      return `connected wallet`;
    
    case 'user.follow':
      return `followed ${activity.data.targetName}`;
    
    default:
      return activity.type.replace(/\./g, ' ');
  }
}

/**
 * Render additional activity details based on type
 */
function renderActivityDetails(activity: ActivityItem) {
  switch (activity.type) {
    case 'points.awarded':
      return (
        <div className="mt-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 py-1 px-2 rounded">
          +{activity.data.amount} points from {activity.data.source}
        </div>
      );
    
    case 'achievement.unlocked':
      return (
        <div className="mt-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 py-1 px-2 rounded flex items-center">
          <Award size={14} className="mr-1" />
          {activity.data.name}
          {activity.data.pointsAwarded > 0 && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded-full">
              +{activity.data.pointsAwarded} points
            </span>
          )}
        </div>
      );
    
    case 'user.levelUp':
      return (
        <div className="mt-1 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 py-1 px-2 rounded flex items-center">
          <Trophy size={14} className="mr-1" />
          Reached Level {activity.data.newLevel}
          {activity.data.pointsAwarded > 0 && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded-full">
              +{activity.data.pointsAwarded} points
            </span>
          )}
        </div>
      );
    
    case 'content.commented':
      return activity.data.comment ? (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
          {activity.data.comment.length > 100 
            ? `${activity.data.comment.substring(0, 100)}...` 
            : activity.data.comment}
        </div>
      ) : null;
    
    default:
      return null;
  }
}
