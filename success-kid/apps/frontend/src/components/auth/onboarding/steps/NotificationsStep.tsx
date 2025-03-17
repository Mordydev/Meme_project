'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth/authStore';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

interface NotificationsStepProps {
  onComplete: (data: any) => void;
  isSubmitting: boolean;
}

// Notification types
const notificationTypes = [
  {
    id: 'points_earned',
    title: 'Points Earned',
    description: 'Get notified when you earn points for activities'
  },
  {
    id: 'achievements',
    title: 'Achievements',
    description: 'Get notified when you unlock new achievements'
  },
  {
    id: 'comments',
    title: 'Comments & Replies',
    description: 'Get notified when someone comments on your content or replies to your comments'
  },
  {
    id: 'mentions',
    title: 'Mentions',
    description: 'Get notified when someone mentions you in a post or comment'
  },
  {
    id: 'follows',
    title: 'New Followers',
    description: 'Get notified when someone follows you'
  },
  {
    id: 'product_updates',
    title: 'Product Updates',
    description: 'Receive updates about new features and improvements'
  },
  {
    id: 'newsletter',
    title: 'Weekly Newsletter',
    description: 'Receive a weekly digest of trending content and platform news'
  }
];

export function NotificationsStep({ onComplete, isSubmitting }: NotificationsStepProps) {
  const { profile, updateProfile } = useAuthStore();
  
  const [emailEnabled, setEmailEnabled] = useState(
    profile?.notificationPreferences?.email !== false
  );
  const [pushEnabled, setPushEnabled] = useState(
    profile?.notificationPreferences?.push !== false
  );
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>(
    profile?.notificationSettings || {
      points_earned: true,
      achievements: true,
      comments: true,
      mentions: true,
      follows: true,
      product_updates: true,
      newsletter: false
    }
  );
  
  // Toggle notification channel
  const toggleChannel = (channel: 'email' | 'push', enabled: boolean) => {
    if (channel === 'email') {
      setEmailEnabled(enabled);
    } else {
      setPushEnabled(enabled);
    }
  };
  
  // Toggle specific notification type
  const toggleNotificationType = (notificationId: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update profile in store
    updateProfile({
      notificationPreferences: {
        email: emailEnabled,
        push: pushEnabled
      },
      notificationSettings
    });
    
    // Complete the step
    onComplete({
      notificationPreferences: {
        email: emailEnabled,
        push: pushEnabled
      },
      notificationSettings
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Notification Preferences</h2>
        <p className="text-gray-600">Choose how you want to be notified about activity on the platform</p>
      </div>
      
      {/* Notification channels */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-medium">Notification Channels</h3>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h4 className="font-medium">Email Notifications</h4>
            <p className="text-sm text-gray-600">Receive notifications via email</p>
          </div>
          <Switch 
            checked={emailEnabled}
            onChange={toggleChannel.bind(null, 'email')}
          />
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h4 className="font-medium">Push Notifications</h4>
            <p className="text-sm text-gray-600">Receive notifications in your browser or mobile app</p>
          </div>
          <Switch 
            checked={pushEnabled}
            onChange={toggleChannel.bind(null, 'push')}
          />
        </div>
      </div>
      
      {/* Notification types */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">What You'll Be Notified About</h3>
        
        {notificationTypes.map((notification) => (
          <div key={notification.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.description}</p>
            </div>
            <Switch 
              checked={notificationSettings[notification.id] || false}
              onChange={() => toggleNotificationType(notification.id)}
              disabled={!emailEnabled && !pushEnabled}
            />
          </div>
        ))}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        Save Preferences
      </Button>
    </form>
  );
}
