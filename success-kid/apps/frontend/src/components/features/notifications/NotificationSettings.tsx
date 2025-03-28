/**
 * Notification Settings Component
 * Allows users to configure their notification preferences
 */
'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings as NotificationSettingsType, NotificationType } from '@/types';
import { Button, Card } from '@/components/ui';
import { Bell, Clock, Mail, Smartphone } from 'lucide-react';

interface NotificationSettingsProps {
  onSave?: () => void;
}

/**
 * Notification Settings Component
 */
export function NotificationSettings({ onSave }: NotificationSettingsProps) {
  // Get notification settings
  const { settings, updateSettings, resetSettings, requestNotificationPermission } = useNotifications();
  
  // Local state for form
  const [formSettings, setFormSettings] = useState<NotificationSettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if settings have changed
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(formSettings);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // If push notifications are enabled, request permission
    if (formSettings.delivery.push && !settings.delivery.push) {
      const permission = await requestNotificationPermission();
      
      // Update push setting based on permission result
      if (!permission) {
        setFormSettings(prev => ({
          ...prev,
          delivery: {
            ...prev.delivery,
            push: false
          }
        }));
      }
    }
    
    // Save settings
    updateSettings(formSettings);
    setIsSaving(false);
    
    // Call onSave callback if provided
    if (onSave) {
      onSave();
    }
  };
  
  // Handle category toggle
  const handleCategoryToggle = (category: Exclude<NotificationType, 'all'>) => {
    setFormSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };
  
  // Handle delivery method toggle
  const handleDeliveryToggle = (method: keyof NotificationSettingsType['delivery']) => {
    setFormSettings(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [method]: !prev.delivery[method]
      }
    }));
  };
  
  // Handle frequency change
  const handleFrequencyChange = (frequency: NotificationSettingsType['frequency']) => {
    setFormSettings(prev => ({
      ...prev,
      frequency
    }));
  };
  
  // Handle quiet hours toggle
  const handleQuietHoursToggle = () => {
    setFormSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };
  
  // Handle quiet hours time change
  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setFormSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Notification Categories</h2>
        <Card className="p-0 divide-y">
          {Object.entries(formSettings.categories).map(([category, enabled]) => (
            <div key={category} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium capitalize">{category}</h3>
                <p className="text-sm text-neutral-500">
                  {getCategoryDescription(category as Exclude<NotificationType, 'all'>)}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleCategoryToggle(category as Exclude<NotificationType, 'all'>)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          ))}
        </Card>
      </div>
      
      {/* Delivery Methods */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Delivery Methods</h2>
        <Card className="p-0 divide-y">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-3 text-neutral-500" />
              <div>
                <h3 className="font-medium">In-App Notifications</h3>
                <p className="text-sm text-neutral-500">
                  Receive notifications in the platform
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.delivery.inApp}
                onChange={() => handleDeliveryToggle('inApp')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-neutral-500" />
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-neutral-500">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.delivery.email}
                onChange={() => handleDeliveryToggle('email')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 mr-3 text-neutral-500" />
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-neutral-500">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.delivery.push}
                onChange={() => handleDeliveryToggle('push')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </Card>
      </div>
      
      {/* Frequency */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Notification Frequency</h2>
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="immediate"
                name="frequency"
                value="immediate"
                checked={formSettings.frequency === 'immediate'}
                onChange={() => handleFrequencyChange('immediate')}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="immediate" className="ml-2 text-sm font-medium">
                Immediate - Receive notifications as they happen
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="batched"
                name="frequency"
                value="batched"
                checked={formSettings.frequency === 'batched'}
                onChange={() => handleFrequencyChange('batched')}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="batched" className="ml-2 text-sm font-medium">
                Batched - Receive notifications in batches (every hour)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="daily"
                name="frequency"
                value="daily"
                checked={formSettings.frequency === 'daily'}
                onChange={() => handleFrequencyChange('daily')}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="daily" className="ml-2 text-sm font-medium">
                Daily - Receive a daily digest of notifications
              </label>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quiet Hours */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quiet Hours</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3 text-neutral-500" />
              <div>
                <h3 className="font-medium">Do Not Disturb</h3>
                <p className="text-sm text-neutral-500">
                  Pause notifications during specified hours
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.quietHours.enabled}
                onChange={handleQuietHoursToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          {formSettings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="start-time"
                  value={formSettings.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="end-time" className="block text-sm font-medium mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="end-time"
                  value={formSettings.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={resetSettings}
        >
          Reset to Defaults
        </Button>
        
        <div className="space-x-2">
          <Button
            type="submit"
            variant="primary"
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}

// Helper to get category descriptions
function getCategoryDescription(category: Exclude<NotificationType, 'all'>): string {
  switch (category) {
    case 'achievement':
      return 'Notifications for achievements and badges';
    case 'social':
      return 'Notifications about follows, mentions, and comments';
    case 'system':
      return 'Important system announcements and updates';
    case 'content':
      return 'Notifications about new content and posts';
    case 'market':
      return 'Market updates and milestone achievements';
    case 'points':
      return 'Notifications about points earned and redeemed';
    default:
      return 'Notifications for this category';
  }
}

export default NotificationSettings;
