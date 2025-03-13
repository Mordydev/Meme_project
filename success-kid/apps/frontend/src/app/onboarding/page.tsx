'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';

// Import onboarding step components (will create these next)
import ProfileSetupStep from '@/components/features/onboarding/ProfileSetupStep';
import InterestsSelectionStep from '@/components/features/onboarding/InterestsSelectionStep';
import WalletConnectionStep from '@/components/features/onboarding/WalletConnectionStep';
import CompleteStep from '@/components/features/onboarding/CompleteStep';

// Define our onboarding steps
const STEPS = [
  { id: 'profile', title: 'Basic Info', component: ProfileSetupStep },
  { id: 'interests', title: 'Your Interests', component: InterestsSelectionStep },
  { id: 'wallet', title: 'Connect Wallet (Optional)', component: WalletConnectionStep },
  { id: 'complete', title: 'All Set!', component: CompleteStep },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { profile, updateProfile, isLoading: isProfileLoading } = useUserStore();
  const { setOnboarded } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize step data with user info if available
  useEffect(() => {
    if (isUserLoaded && user) {
      setStepData(prev => ({
        ...prev,
        profile: {
          displayName: user.fullName || '',
          username: '',
          bio: '',
        }
      }));
    }
  }, [isUserLoaded, user]);
  
  // Move to the next step
  const handleNext = (data?: Record<string, any>) => {
    // Save step data if provided
    if (data) {
      setStepData(prev => ({
        ...prev,
        [STEPS[currentStep].id]: data
      }));
    }
    
    // Move to next step if not on last step
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Move to the previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Handle skipping optional steps
  const handleSkip = () => {
    if (STEPS[currentStep].id === 'wallet') {
      handleNext({ connected: false });
    }
  };
  
  // Handle completion of onboarding
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Combine all step data
      const profileData = {
        displayName: stepData.profile?.displayName || user?.fullName || '',
        username: stepData.profile?.username || '',
        bio: stepData.profile?.bio || '',
        // Use avatar from clerk or default
        avatar: user?.imageUrl || '/images/avatars/default.png',
        // Initialize level and joinedAt
        level: 1,
        interests: stepData.interests?.selectedInterests || [],
        wallet: {
          connected: stepData.wallet?.connected || false,
          address: stepData.wallet?.address || undefined,
          isVerified: stepData.wallet?.isVerified || false,
        },
        // Achievement for completing onboarding
        achievements: ['profile_complete'],
        joinedAt: new Date(),
      };
      
      // Update profile in store
      updateProfile(profileData);
      
      // Set user as onboarded in auth store
      setOnboarded(true);
      
      // Redirect to dashboard after a short delay to allow for celebration
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while user data is loading
  if (!isUserLoaded || isProfileLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Get current step component
  const StepComponent = STEPS[currentStep].component;
  
  // Calculate progress percentage
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between">
          {STEPS.map((step, index) => (
            <div 
              key={step.id}
              className={`text-sm font-medium ${
                index <= currentStep ? 'text-primary' : 'text-gray-400'
              }`}
            >
              {step.title}
            </div>
          ))}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Step content */}
      <Card className="mb-6 p-6">
        <StepComponent 
          data={stepData[STEPS[currentStep].id] || {}}
          onComplete={handleNext}
          user={user}
        />
      </Card>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          Back
        </Button>
        
        <div className="flex gap-2">
          {/* Skip button for optional steps */}
          {STEPS[currentStep].id === 'wallet' && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
          )}
          
          {/* Next/Complete button */}
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Completing...
                </>
              ) : (
                'Complete & Continue'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => StepComponent.handleNext?.(stepData[STEPS[currentStep].id] || {})}
              disabled={isSubmitting}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
