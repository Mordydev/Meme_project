'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth/authStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { FeatureHighlightStep } from './steps/FeatureHighlightStep';
import { PointsIntroductionStep } from './steps/PointsIntroductionStep';
import { ConnectWalletPrompt } from './steps/ConnectWalletPrompt';
import { OnboardingCompletion } from './steps/OnboardingCompletion';
import { motion, AnimatePresence } from 'framer-motion';

export interface OnboardingFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

interface OnboardingContainerProps {
  onComplete: () => void;
  initialStep?: number;
  features?: OnboardingFeature[];
}

export function OnboardingContainer({ 
  onComplete,
  initialStep = 0,
  features,
}: OnboardingContainerProps) {
  const { onboarding, setOnboardingStep, completeOnboardingStep, setIsOnboarded } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isExiting, setIsExiting] = useState(false);
  
  // Number of onboarding steps (welcome, features, points, wallet, completion)
  const totalSteps = 5;
  
  // Update the store when step changes
  useEffect(() => {
    setOnboardingStep(currentStep);
  }, [currentStep, setOnboardingStep]);
  
  const handleNext = () => {
    // If this is the last step, complete onboarding
    if (currentStep === totalSteps - 1) {
      setIsOnboarded(true);
      onComplete();
      return;
    }
    
    setIsExiting(true);
    
    // Mark the current step as completed
    completeOnboardingStep(`onboarding-step-${currentStep}`);
    
    // After exit animation, move to next step
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setIsExiting(false);
    }, 300);
  };
  
  // Skip the onboarding process entirely
  const handleSkip = () => {
    setIsOnboarded(true);
    onComplete();
  };
  
  return (
    <div className="mx-auto w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {!isExiting && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl bg-white p-6 shadow-lg"
          >
            {currentStep === 0 && (
              <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
            )}
            
            {currentStep === 1 && (
              <FeatureHighlightStep 
                features={features} 
                onNext={handleNext} 
                onSkip={handleSkip}
              />
            )}
            
            {currentStep === 2 && (
              <PointsIntroductionStep onNext={handleNext} onSkip={handleSkip} />
            )}
            
            {currentStep === 3 && (
              <ConnectWalletPrompt onNext={handleNext} onSkip={handleSkip} />
            )}
            
            {currentStep === 4 && (
              <OnboardingCompletion onComplete={handleNext} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Progress indicator */}
      <div className="mx-auto mt-6 flex w-full max-w-xs justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={`indicator-${index}`}
            className={`h-2 w-12 rounded-full transition-all ${
              index === currentStep
                ? 'bg-primary'
                : index < currentStep
                ? 'bg-primary/40'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
