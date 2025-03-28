'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, UserProfile } from '@/store/auth/authStore';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { InterestsSelectionStep } from './steps/InterestsSelectionStep';
import { NotificationOptionsStep } from './steps/NotificationOptionsStep';
import { ProfilePreviewStep } from './steps/ProfilePreviewStep';
import { ProgressIndicator } from './ProgressIndicator';
import { useUser } from '@clerk/nextjs';

const STEPS = [
  { id: 'basic-info', title: 'Basic Info' },
  { id: 'interests', title: 'Your Interests' },
  { id: 'notifications', title: 'Notifications' },
  { id: 'preview', title: 'Review' }
];

interface ProfileSetupContainerProps {
  onComplete: () => void;
  initialStep?: number;
}

export function ProfileSetupContainer({ 
  onComplete,
  initialStep = 0
}: ProfileSetupContainerProps) {
  const { user } = useUser();
  const { profile, updateProfile, setProfile, onboarding, setOnboardingStep } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize profile data with Clerk user data if available
  useEffect(() => {
    if (user && !profile) {
      const initialProfile: UserProfile = {
        displayName: user.fullName || '',
        username: user.username || '',
        bio: '',
        avatarUrl: user.imageUrl || '',
        interests: [],
        notificationPreferences: {
          email: true,
          push: false,
        }
      };
      
      setProfile(initialProfile);
    }
    
    // Sync current step with the store
    setOnboardingStep(currentStep);
  }, [user, profile, setProfile, currentStep, setOnboardingStep]);
  
  // Calculate progress percentage
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setOnboardingStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setOnboardingStep(currentStep - 1);
    }
  };
  
  const handleUpdateProfile = (data: Partial<UserProfile>) => {
    updateProfile(data);
  };
  
  const handleComplete = async () => {
    if (!profile) return;
    
    setIsSubmitting(true);
    
    try {
      // Here, you would normally make an API call to save the profile
      // For now, we'll simulate a successful save
      console.log('Saving profile data:', profile);
      
      // Wait for a simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the completion callback
      onComplete();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
      <h1 className="mb-6 text-center text-3xl font-bold text-primary">Create Your Profile</h1>
      
      <ProgressIndicator 
        steps={STEPS} 
        currentStep={currentStep} 
        progress={progress} 
      />
      
      <div className="mt-8">
        {currentStep === 0 && (
          <BasicInfoStep 
            profile={profile} 
            onUpdate={handleUpdateProfile} 
            onNext={handleNext} 
          />
        )}
        
        {currentStep === 1 && (
          <InterestsSelectionStep 
            profile={profile} 
            onUpdate={handleUpdateProfile}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
        
        {currentStep === 2 && (
          <NotificationOptionsStep 
            profile={profile} 
            onUpdate={handleUpdateProfile}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
        
        {currentStep === 3 && (
          <ProfilePreviewStep 
            profile={profile}
            onUpdate={handleUpdateProfile}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
