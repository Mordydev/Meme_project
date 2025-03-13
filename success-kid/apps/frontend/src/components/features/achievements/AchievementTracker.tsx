'use client';

import { useEffect } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { useAchievementStore } from '@/store/useAchievementStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * Component that tracks user events and activities for achievements
 * This component is invisible and only handles the logic of tracking achievements
 */
export function AchievementTracker() {
  const { subscribe } = useWebSocketContext();
  const { user } = useAuth();
  const { triggerEvent } = useAchievementStore();

  // Listen for user activities via WebSocket events
  useEffect(() => {
    if (!user?.id) return;

    // Track activity for content creation
    const unsubscribeContent = subscribe('content.created', (message) => {
      if (message.data) {
        triggerEvent('content_created', message.data);
      }
    });

    // Track activity for comments
    const unsubscribeComment = subscribe('comment.created', (message) => {
      if (message.data) {
        triggerEvent('comment_created', message.data);
      }
    });

    // Track activity for reactions/upvotes
    const unsubscribeReaction = subscribe('reaction.created', (message) => {
      if (message.data) {
        triggerEvent('reaction_created', message.data);
      }
    });

    // Track wallet connection events
    const unsubscribeWallet = subscribe('wallet.connected', (message) => {
      if (message.data) {
        triggerEvent('wallet_connected', message.data);
      }
    });

    // Track login streak
    const unsubscribeLogin = subscribe('user.login', (message) => {
      if (message.data) {
        triggerEvent('user_login', message.data);
      }
    });

    // Track points milestone achievements
    const unsubscribePoints = subscribe('points.milestone', (message) => {
      if (message.data) {
        triggerEvent('points_milestone', message.data);
      }
    });

    // Return cleanup function
    return () => {
      unsubscribeContent();
      unsubscribeComment();
      unsubscribeReaction();
      unsubscribeWallet();
      unsubscribeLogin();
      unsubscribePoints();
    };
  }, [user?.id, subscribe, triggerEvent]);

  // Track daily login on component mount
  useEffect(() => {
    if (user?.id) {
      // Check for daily login achievement
      triggerEvent('daily_login');
    }
  }, [user?.id, triggerEvent]);

  // This component doesn't render anything
  return null;
}

export default AchievementTracker;
