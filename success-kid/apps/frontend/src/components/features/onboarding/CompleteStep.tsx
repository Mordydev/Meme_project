'use client';

import { useState, useEffect } from 'react';
import { User } from '@clerk/nextjs/dist/types/server';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/button';
import AchievementUnlock from '@/components/features/achievements/AchievementUnlock'; 

interface CompleteStepProps {
  data: Record<string, any>;
  onComplete: (data: any) => void;
  user: User | null;
}

export default function CompleteStep({ data, onComplete, user }: CompleteStepProps) {
  const { profile } = useUserStore();
  const [showAchievement, setShowAchievement] = useState(false);
  
  useEffect(() => {
    // Show achievement notification after a short delay
    const timer = setTimeout(() => {
      setShowAchievement(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismissAchievement = () => {
    setShowAchievement(false);
  };
  
  const handleFinish = () => {
    onComplete({});
  };
  
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-6 h-20 w-20 rounded-full bg-green-100 p-5 text-green-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      
      <h2 className="mb-4 text-2xl font-bold">You're All Set!</h2>
      
      <p className="mb-6 text-gray-600">
        Your profile has been created and you've earned your first achievement
      </p>
      
      <div className="mb-8 w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 font-medium">Your Profile Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-left font-medium">Display Name:</div>
          <div className="text-right">{profile?.displayName || user?.fullName}</div>
          
          <div className="text-left font-medium">Username:</div>
          <div className="text-right">@{profile?.username}</div>
          
          <div className="text-left font-medium">Interests:</div>
          <div className="text-right">
            {profile?.interests?.length || 0} selected
          </div>
          
          <div className="text-left font-medium">Wallet:</div>
          <div className="text-right">
            {profile?.wallet?.connected ? 'Connected' : 'Not connected'}
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleFinish}
        className="mb-4"
      >
        Go to Dashboard
      </Button>
      
      <p className="text-sm text-gray-500">
        You can always update your profile settings later
      </p>
      
      {showAchievement && (
        <AchievementUnlock
          achievement={{
            id: 'first_steps',
            title: 'First Steps',
            description: 'Complete your profile setup',
            iconUrl: '/images/achievements/first-steps.svg'
          }}
          points={100}
          onDismiss={handleDismissAchievement}
        />
      )}
    </div>
  );
}

// Static method to handle next button click from parent
CompleteStep.handleNext = (data: any) => {
  return true;
};
