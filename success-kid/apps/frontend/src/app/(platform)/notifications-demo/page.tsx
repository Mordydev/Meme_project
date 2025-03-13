'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NotificationButton } from '@/components/ui/notification-button';
import { useUIStore } from '@/store/useUIStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import DemoNav from './DemoNav';
import ApiDocs from './api-docs';

const NotificationsDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useUIStore(state => state.addToast);
  const openModal = useUIStore(state => state.openModal);
  const addNotification = useNotificationStore(state => state.addNotification);
  
  // Function to trigger test notifications via mock WebSocket endpoint
  const triggerNotification = async (type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ws-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: type,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger notification');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // This would normally come through WebSocket
        // We're simulating the WebSocket event
        const wsEvent = data.data;
        
        if (wsEvent.type === 'notification:new') {
          // Add the notification to store
          addNotification(wsEvent.data);
          
          // Show a toast notification
          addToast(
            wsEvent.data.title,
            wsEvent.data.type === 'achievement' ? 'success' : 
            wsEvent.data.type === 'social' ? 'info' : 
            wsEvent.data.type === 'market' ? 'warning' : 'info'
          );
        }
      }
    } catch (error) {
      console.error('Error triggering notification:', error);
      addToast('Failed to trigger notification', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DemoNav />
      <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Notification System Demo</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          This page demonstrates the real-time notification system components.
        </p>
      </div>
      
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Notification Components</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Notification Button</span>
              <NotificationButton />
            </div>
            
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="mb-2 font-medium">Interaction Options</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => openModal('notification-center')}
                  >
                    Open Notification Center
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => openModal('notification-settings')}
                    variant="outline"
                  >
                    Open Notification Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Trigger Test Notifications</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="mb-3 font-medium">Notification Types</h3>
              <div className="flex flex-col gap-3">
                <Button 
                  size="sm" 
                  onClick={() => triggerNotification('new-achievement')}
                  isLoading={isLoading}
                  variant="success"
                >
                  Achievement Notification
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={() => triggerNotification('new-follower')}
                  isLoading={isLoading}
                  variant="secondary"
                >
                  Social Notification
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={() => triggerNotification('market-update')}
                  isLoading={isLoading}
                  variant="primary"
                >
                  Market Notification
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Implementation Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">Components</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              <li>NotificationProvider - Manages WebSocket events and notification state</li>
              <li>NotificationButton - Button with badge for opening notification center</li>
              <li>NotificationCenter - Modal for viewing and managing notifications</li>
              <li>ToastNotification - Toast alerts for real-time notifications</li>
              <li>NotificationSettings - User preferences for notification delivery</li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-2 font-medium">Features</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              <li>Real-time notifications via WebSocket</li>
              <li>Toast notifications for immediate alerts</li>
              <li>Notification center for history and management</li>
              <li>Read/unread status tracking</li>
              <li>Category filtering and grouping</li>
              <li>Preference management for delivery options</li>
              <li>Mobile-optimized responsive design</li>
            </ul>
          </div>
        </div>
      </Card>
      
      <ApiDocs />
    </div>
    </>
  );
};

export default NotificationsDemo;
