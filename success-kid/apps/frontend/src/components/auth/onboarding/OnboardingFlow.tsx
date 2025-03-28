'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth/authStore';
import { Button } from '@/components/ui/Button';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { InterestsStep } from './steps/InterestsStep';
import { NotificationsStep } from './steps/NotificationsStep';
import { WalletSetupStep } from './steps/WalletSetupStep';
import { CompletionStep } from './steps/CompletionStep';

/**
 * Multi-step onboarding flow for new users
 */
export function OnboardingFlow() {
  const { user } = useAuth();
  const { onboarding, setOnboardingStep, setIsOnboarded, completeOnboardingStep } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const steps = [
    { id: 'profile', title: 'Profile Setup', component: ProfileSetupStep },
    { id: 'interests', title: 'Your Interests', component: InterestsStep },
    { id: 'notifications', title: 'Notification Preferences', component: NotificationsStep },
    { id: 'wallet', title: 'Connect Your Wallet', component: WalletSetupStep },
    { id: 'completion', title: 'All Done!', component: CompletionStep }
  ];
  
  const currentStep = steps[onboarding.currentStep];
  const StepComponent = currentStep.component;
  
  // Handle step completion
  const handleCompleteStep = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Mark step as completed
      completeOnboardingStep(currentStep.id);
      
      // If this is the last step, mark onboarding as complete
      if (onboarding.currentStep === steps.length - 1) {
        // Update Clerk user metadata to mark onboarding complete
        await user?.update({
          publicMetadata: {
            ...user.publicMetadata,
            onboarded: true
          }
        });
        
        // Update local state
        setIsOnboarded(true);
        
        // Short delay before redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing onboarding step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle navigation between steps
  const handleNextStep = () => {
    if (onboarding.currentStep < steps.length - 1) {
      setOnboardingStep(onboarding.currentStep + 1);
    }
  };
  
  const handlePreviousStep = () => {
    if (onboarding.currentStep > 0) {
      setOnboardingStep(onboarding.currentStep - 1);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = ((onboarding.currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Success Kid</h1>
        <p className="text-gray-600">Let's get your account set up in just a few steps</p>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="bg-primary h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Step indicator */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex flex-col items-center ${index <= onboarding.currentStep ? 'text-primary' : 'text-gray-400'}`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                index < onboarding.currentStep 
                  ? 'bg-primary text-white' 
                  : index === onboarding.currentStep 
                    ? 'border-2 border-primary text-primary' 
                    : 'border-2 border-gray-300 text-gray-400'
              }`}
            >
              {index < onboarding.currentStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs font-medium">{step.title}</span>
          </div>
        ))}
      </div>
      
      {/* Current step */}
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg p-6 shadow-sm border"
      >
        <StepComponent 
          onComplete={handleCompleteStep}
          isSubmitting={isSubmitting}
        />
      </motion.div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={onboarding.currentStep === 0 || isSubmitting}
        >
          Back
        </Button>
        
        {onboarding.currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNextStep}
            disabled={!onboarding.completedSteps.includes(currentStep.id) || isSubmitting}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={() => router.push('/dashboard')}
            disabled={!onboarding.isOnboarded || isSubmitting}
          >
            Get Started
          </Button>
        )}
      </div>
    </div>
  );
}
