'use client';

import { useState } from 'react';
import { UserProfile } from '@/store/auth/authStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface NotificationOptionsStepProps {
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function NotificationOptionsStep({ 
  profile, 
  onUpdate, 
  onNext,
  onPrevious
}: NotificationOptionsStepProps) {
  const [emailNotifications, setEmailNotifications] = useState(
    profile?.notificationPreferences?.email ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(
    profile?.notificationPreferences?.push ?? false
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update profile with notification preferences
    onUpdate({
      notificationPreferences: {
        email: emailNotifications,
        push: pushNotifications
      }
    });
    
    // Move to next step
    onNext();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-bold text-gray-800">Notification Preferences</h2>
          <p className="mb-6 text-gray-600">
            Choose how you'd like to receive updates and notifications.
          </p>
          
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="font-medium text-gray-800">Email Notifications</h3>
                <p className="text-sm text-gray-500">
                  Receive updates, achievements, and important announcements via email
                </p>
              </div>
              <div className="relative h-6 w-12">
                <input
                  type="checkbox"
                  id="emailToggle"
                  className="peer sr-only"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <label
                  htmlFor="emailToggle"
                  className="absolute inset-0 cursor-pointer rounded-full bg-gray-300 transition peer-checked:bg-primary"
                >
                  <span className="absolute inset-y-0 left-0 m-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6" />
                </label>
              </div>
            </div>
            
            {/* Push Notifications */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="font-medium text-gray-800">Push Notifications</h3>
                <p className="text-sm text-gray-500">
                  Get real-time alerts for activity and interactions
                </p>
              </div>
              <div className="relative h-6 w-12">
                <input
                  type="checkbox"
                  id="pushToggle"
                  className="peer sr-only"
                  checked={pushNotifications}
                  onChange={() => setPushNotifications(!pushNotifications)}
                />
                <label
                  htmlFor="pushToggle"
                  className="absolute inset-0 cursor-pointer rounded-full bg-gray-300 transition peer-checked:bg-primary"
                >
                  <span className="absolute inset-y-0 left-0 m-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6" />
                </label>
              </div>
            </div>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            You can always change these settings later in your profile preferences.
          </p>
        </div>
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            onClick={onPrevious}
            variant="outline"
          >
            Back
          </Button>
          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
