'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/store/auth/authStore';
import { ProfileSetupContainer } from '@/components/auth/profile/ProfileSetupContainer';
import { OnboardingContainer } from '@/components/auth/onboarding/OnboardingContainer';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { profile, isProfileComplete, onboarding, setIsOnboarded } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<'profile' | 'onboarding'>('profile');
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redirect to dashboard if already onboarded
  useEffect(() => {
    if (isUserLoaded && onboarding.isOnboarded) {
      router.push('/dashboard');
    }
  }, [isUserLoaded, onboarding.isOnboarded, router]);
  
  const handleProfileComplete = useCallback(() => {
    setCurrentStep('onboarding');
  }, []);
  
  const handleOnboardingComplete = useCallback(() => {
    setIsOnboarded(true);
    setIsRedirecting(true);
    
    // In a real implementation, we would make an API call to update the onboarded status
    // For now, we'll just redirect to the dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  }, [setIsOnboarded, router]);
  
  const handleSkipAll = useCallback(() => {
    setIsOnboarded(true);
    setIsRedirecting(true);
    
    // In a real implementation, we would make an API call to update the onboarded status
    // For now, we'll just redirect to the dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  }, [setIsOnboarded, router]);
  
  if (!isUserLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-xl text-gray-400">Loading...</div>
      </div>
    );
  }
  
  if (isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="mb-4 text-2xl font-bold text-primary">Welcome to Success Kid!</div>
        <div className="mb-6 text-gray-600">Redirecting to your dashboard...</div>
        <div className="h-2 w-40 rounded-full bg-gray-200">
          <div className="h-full animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 flex justify-between">
        <div className="text-xl font-bold text-primary">Success Kid</div>
        <Button 
          variant="ghost" 
          onClick={handleSkipAll}
          className="text-sm text-gray-500"
        >
          Skip all &amp; go to dashboard
        </Button>
      </div>
      
      {currentStep === 'profile' && (
        <ProfileSetupContainer 
          onComplete={handleProfileComplete} 
          initialStep={profile && isProfileComplete ? 3 : 0}
        />
      )}
      
      {currentStep === 'onboarding' && (
        <OnboardingContainer 
          onComplete={handleOnboardingComplete} 
          initialStep={0}
        />
      )}
      
      <div className="mt-8 text-center text-sm text-gray-500">
        © 2025 Success Kid Community Platform
      </div>
    </div>
  );
}
