/**
 * Event Simulator Component (Development Only)
 * Allows developers to trigger various real-time events for testing
 */
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEventStore } from '@/lib/events';

// Only include this component in development
const isDev = process.env.NODE_ENV === 'development';

export function EventSimulator() {
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const { addNotification } = useEventStore();
  
  // Simulate points awarded event
  const simulatePointsAwarded = () => {
    const amount = Math.floor(Math.random() * 50) + 10;
    const sources = ['post_creation', 'comment', 'daily_login', 'achievement', 'upvote_received'];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    addNotification({
      type: 'points',
      message: `You earned ${amount} points from ${source}!`,
      data: { amount, source },
      timestamp: new Date().toISOString(),
    });
    
    setLastEvent(`Points Awarded: ${amount} points from ${source}`);
  };
  
  // Simulate achievement unlocked event
  const simulateAchievementUnlocked = () => {
    const achievements = [
      { name: 'First Post', description: 'Create your first post' },
      { name: 'Conversation Starter', description: 'Receive 5 comments on one of your posts' },
      { name: 'Daily Devotion', description: 'Log in for 7 consecutive days' },
      { name: 'Content Creator', description: 'Create 25 posts' },
      { name: 'Rising Star', description: 'Reach the daily leaderboard top 10' }
    ];
    
    const achievement = achievements[Math.floor(Math.random() * achievements.length)];
    
    addNotification({
      type: 'achievement',
      message: `Achievement unlocked: ${achievement.name}!`,
      data: { achievement },
      timestamp: new Date().toISOString(),
    });
    
    setLastEvent(`Achievement Unlocked: ${achievement.name}`);
  };
  
  // Simulate new content event
  const simulateNewContent = () => {
    const authors = ['Alice', 'Bob', 'Charlie', 'David', 'Emma'];
    const author = authors[Math.floor(Math.random() * authors.length)];
    
    const contentTypes = ['post', 'poll', 'image', 'link'];
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    
    const contentPreviews = [
      'Just reached a new milestone in my crypto journey!',
      'Who else is excited about the new token features?',
      'Check out this amazing Success Kid meme I created!',
      'Thoughts on the recent market movement?',
      'Finally converted my points to tokens today!'
    ];
    
    const preview = contentPreviews[Math.floor(Math.random() * contentPreviews.length)];
    
    addNotification({
      type: 'content',
      message: `New ${contentType} from ${author}: "${preview}"`,
      data: { author, contentType, preview, id: `content_${Date.now()}` },
      timestamp: new Date().toISOString(),
    });
    
    setLastEvent(`New Content: ${contentType} by ${author}`);
  };
  
  // Simulate milestone reached event
  const simulateMilestoneReached = () => {
    const milestones = [
      { name: '$100,000 Market Cap', value: '$100,000' },
      { name: '$500,000 Market Cap', value: '$500,000' },
      { name: '$1,000,000 Market Cap', value: '$1,000,000' },
      { name: '1,000 Community Members', value: '1,000 members' },
      { name: '10,000 Platform Posts', value: '10,000 posts' }
    ];
    
    const milestone = milestones[Math.floor(Math.random() * milestones.length)];
    
    addNotification({
      type: 'milestone',
      message: `Market milestone reached: ${milestone.name} at ${milestone.value}!`,
      data: { milestone: milestone.name, value: milestone.value },
      timestamp: new Date().toISOString(),
    });
    
    setLastEvent(`Milestone Reached: ${milestone.name}`);
  };
  
  // If not in development, don't render
  if (!isDev) return null;
  
  return (
    <Card className="p-4 border-dashed border-yellow-300 bg-yellow-50">
      <h3 className="text-lg font-medium mb-2">Event Simulator</h3>
      <p className="text-xs text-yellow-700 mb-4">Development tool - simulate real-time events</p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button 
          onClick={simulatePointsAwarded}
          size="sm"
          variant="outline"
        >
          Points Awarded
        </Button>
        <Button 
          onClick={simulateAchievementUnlocked}
          size="sm"
          variant="outline"
        >
          Achievement Unlocked
        </Button>
        <Button 
          onClick={simulateNewContent}
          size="sm"
          variant="outline"
        >
          New Content
        </Button>
        <Button 
          onClick={simulateMilestoneReached}
          size="sm"
          variant="outline"
        >
          Milestone Reached
        </Button>
      </div>
      
      {lastEvent && (
        <div className="text-xs p-2 bg-yellow-100 rounded">
          <strong>Last simulated:</strong> {lastEvent}
        </div>
      )}
    </Card>
  );
}

export default EventSimulator;