'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, NotificationSettings as Settings } from '@/store/useNotificationStore';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const settings = useNotificationStore(state => state.settings);
  const updateSettings = useNotificationStore(state => state.updateSettings);
  const updateCategorySettings = useNotificationStore(state => state.updateCategorySettings);
  
  const [formState, setFormState] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  
  // Update form state when settings change
  useEffect(() => {
    setFormState(settings);
  }, [settings]);
  
  // Handle category toggle change
  const handleCategoryChange = (category: keyof Settings['categories'], enabled: boolean) => {
    setFormState(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled,
      },
    }));
  };
  
  // Handle delivery method change
  const handleDeliveryChange = (method: keyof Settings['delivery'], enabled: boolean) => {
    setFormState(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [method]: enabled,
      },
    }));
  };
  
  // Handle frequency change
  const handleFrequencyChange = (frequency: Settings['frequency']) => {
    setFormState(prev => ({
      ...prev,
      frequency,
    }));
  };
  
  // Handle quiet hours toggle
  const handleQuietHoursToggle = (enabled: boolean) => {
    setFormState(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled,
      },
    }));
  };
  
  // Handle quiet hours time change
  const handleQuietHoursTimeChange = (field: 'start' | 'end', value: string) => {
    setFormState(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };
  
  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // First update the local store
      updateSettings(formState);
      
      // Then send to the server
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: formState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notification preferences');
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle reset to defaults
  const handleReset = () => {
    const defaultSettings: Settings = {
      categories: {
        achievement: true,
        social: true,
        system: true,
        content: true,
        market: true,
      },
      delivery: {
        inApp: true,
        email: true,
        push: false,
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    
    setFormState(defaultSettings);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Settings panel */}
          <motion.div
            className="relative flex h-full max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-neutral-800"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Notification Settings
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Customize how and when you receive notifications
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {/* Categories */}
                <section className="p-4">
                  <h3 className="mb-3 text-base font-medium text-neutral-900 dark:text-white">
                    Notification Categories
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="cat-achievement"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Achievements
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Level ups, badges, and milestones
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="cat-achievement"
                          className="peer sr-only"
                          checked={formState.categories.achievement}
                          onChange={(e) => handleCategoryChange('achievement', e.target.checked)}
                          aria-label="Enable achievement notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="cat-social"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Social
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Followers, mentions, and comments
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="cat-social"
                          className="peer sr-only"
                          checked={formState.categories.social}
                          onChange={(e) => handleCategoryChange('social', e.target.checked)}
                          aria-label="Enable social notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="cat-content"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Content
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          New posts, reactions, and trending content
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="cat-content"
                          className="peer sr-only"
                          checked={formState.categories.content}
                          onChange={(e) => handleCategoryChange('content', e.target.checked)}
                          aria-label="Enable content notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="cat-market"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Market
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Price alerts, market milestones, and token updates
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="cat-market"
                          className="peer sr-only"
                          checked={formState.categories.market}
                          onChange={(e) => handleCategoryChange('market', e.target.checked)}
                          aria-label="Enable market notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="cat-system"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          System
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Platform updates, security alerts, and account notifications
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="cat-system"
                          className="peer sr-only"
                          checked={formState.categories.system}
                          onChange={(e) => handleCategoryChange('system', e.target.checked)}
                          aria-label="Enable system notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* Delivery Methods */}
                <section className="p-4">
                  <h3 className="mb-3 text-base font-medium text-neutral-900 dark:text-white">
                    Delivery Methods
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="del-inapp"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          In-App Notifications
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Show notifications within the platform
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="del-inapp"
                          className="peer sr-only"
                          checked={formState.delivery.inApp}
                          onChange={(e) => handleDeliveryChange('inApp', e.target.checked)}
                          aria-label="Enable in-app notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="del-email"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Email Notifications
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Receive notifications via email
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="del-email"
                          className="peer sr-only"
                          checked={formState.delivery.email}
                          onChange={(e) => handleDeliveryChange('email', e.target.checked)}
                          aria-label="Enable email notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="del-push"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Push Notifications
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Receive browser push notifications
                        </p>
                      </div>
                      <div className="relative inline-block h-6 w-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          id="del-push"
                          className="peer sr-only"
                          checked={formState.delivery.push}
                          onChange={(e) => handleDeliveryChange('push', e.target.checked)}
                          aria-label="Enable push notifications"
                        />
                        <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* Frequency */}
                <section className="p-4">
                  <h3 className="mb-3 text-base font-medium text-neutral-900 dark:text-white">
                    Notification Frequency
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="freq-immediate"
                        name="frequency"
                        className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:focus:ring-primary-400"
                        checked={formState.frequency === 'immediate'}
                        onChange={() => handleFrequencyChange('immediate')}
                        aria-label="Immediate notifications"
                      />
                      <div>
                        <label
                          htmlFor="freq-immediate"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Immediate
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Receive notifications as they happen
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="freq-batched"
                        name="frequency"
                        className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:focus:ring-primary-400"
                        checked={formState.frequency === 'batched'}
                        onChange={() => handleFrequencyChange('batched')}
                        aria-label="Batched notifications"
                      />
                      <div>
                        <label
                          htmlFor="freq-batched"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Batched
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Group notifications and receive them periodically
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="freq-daily"
                        name="frequency"
                        className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:focus:ring-primary-400"
                        checked={formState.frequency === 'daily'}
                        onChange={() => handleFrequencyChange('daily')}
                        aria-label="Daily digest notifications"
                      />
                      <div>
                        <label
                          htmlFor="freq-daily"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Daily Digest
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Receive a daily summary of all notifications
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* Quiet Hours */}
                <section className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-neutral-900 dark:text-white">
                      Quiet Hours
                    </h3>
                    <div className="relative inline-block h-6 w-11 flex-shrink-0">
                      <input
                        type="checkbox"
                        id="quiet-hours-toggle"
                        className="peer sr-only"
                        checked={formState.quietHours.enabled}
                        onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                        aria-label="Enable quiet hours"
                      />
                      <div className="peer h-6 w-11 cursor-pointer rounded-full border border-neutral-200 bg-neutral-200 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600 dark:bg-neutral-700 dark:after:border-neutral-800 dark:after:bg-neutral-400 dark:peer-checked:bg-primary-500 dark:peer-checked:after:bg-white"></div>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                    Don't send notifications during these hours
                  </p>
                  {formState.quietHours.enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="quiet-start"
                          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Start Time
                        </label>
                        <input
                          type="time"
                          id="quiet-start"
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white sm:text-sm"
                          value={formState.quietHours.start}
                          onChange={(e) => handleQuietHoursTimeChange('start', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quiet-end"
                          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          End Time
                        </label>
                        <input
                          type="time"
                          id="quiet-end"
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white sm:text-sm"
                          value={formState.quietHours.end}
                          onChange={(e) => handleQuietHoursTimeChange('end', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Time zone: {formState.quietHours.timezone}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
            
            {/* Footer with buttons */}
            <div className="flex items-center justify-between border-t border-neutral-200 p-4 dark:border-neutral-700">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                onClick={handleReset}
              >
                Reset to Defaults
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationSettings;
