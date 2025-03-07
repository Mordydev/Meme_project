'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { WelcomeStep } from './steps/welcome-step'
import { ProfileSetupStep } from './steps/profile-setup-step'
import { FeatureHighlightsStep } from './steps/feature-highlights-step'
import { BattleIntroductionStep } from './steps/battle-introduction-step'
import { CompletionStep } from './steps/completion-step'

const TOTAL_STEPS = 5

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [userData, setUserData] = useState({
    displayName: '',
    interests: [],
    bio: '',
    battleStyle: 'wildStyle',
    onboardingComplete: false
  })
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const prefersReducedMotion = useReducedMotion()

  // Load user data if available
  useEffect(() => {
    if (isLoaded && user) {
      setUserData(prevData => ({
        ...prevData,
        displayName: user.fullName || user.username || ''
      }))
    }
  }, [isLoaded, user])

  // Check if onboarding is complete in localStorage
  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingState')
    if (onboardingData) {
      try {
        const parsedData = JSON.parse(onboardingData)
        if (parsedData.onboardingComplete) {
          // Skip onboarding and redirect to battle
          router.replace('/battle')
        } else if (parsedData.currentStep) {
          // Resume from last step
          setCurrentStep(parsedData.currentStep)
          setUserData(prevData => ({
            ...prevData,
            ...parsedData.userData
          }))
        }
      } catch (error) {
        console.error('Error parsing onboarding data:', error)
      }
    }
  }, [router])

  // Save progress
  useEffect(() => {
    localStorage.setItem('onboardingState', JSON.stringify({
      currentStep,
      userData,
      lastUpdated: new Date().toISOString()
    }))
  }, [currentStep, userData])

  const handleNext = (data = {}) => {
    setUserData(prevData => ({
      ...prevData,
      ...data
    }))

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Mark onboarding as complete
      const updatedData = {
        ...userData,
        ...data,
        onboardingComplete: true
      }
      
      setUserData(updatedData)
      localStorage.setItem('onboardingState', JSON.stringify({
        currentStep: TOTAL_STEPS,
        userData: updatedData,
        lastUpdated: new Date().toISOString(),
        onboardingComplete: true
      }))
      
      // Redirect to battle page
      router.push('/battle')
    }
  }

  const handleSkip = () => {
    // Mark onboarding as complete but without data collection
    const updatedData = {
      ...userData,
      onboardingComplete: true
    }
    
    setUserData(updatedData)
    localStorage.setItem('onboardingState', JSON.stringify({
      currentStep: TOTAL_STEPS,
      userData: updatedData,
      lastUpdated: new Date().toISOString(),
      onboardingComplete: true
    }))
    
    // Redirect to battle page
    router.push('/battle')
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wild-black">
        <div className="animate-spin w-10 h-10 border-4 border-battle-yellow border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const steps = [
    <WelcomeStep 
      key="welcome" 
      userData={userData} 
      onNext={handleNext} 
      onSkip={handleSkip} 
    />,
    <ProfileSetupStep 
      key="profile" 
      userData={userData} 
      onNext={handleNext} 
      onBack={handleBack} 
    />,
    <FeatureHighlightsStep 
      key="features" 
      userData={userData} 
      onNext={handleNext} 
      onBack={handleBack} 
    />,
    <BattleIntroductionStep 
      key="battle" 
      userData={userData} 
      onNext={handleNext} 
      onBack={handleBack} 
    />,
    <CompletionStep 
      key="completion" 
      userData={userData} 
      onComplete={handleNext} 
      onBack={handleBack} 
    />
  ]

  const slideVariants = prefersReducedMotion ? {} : {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  }

  const transition = {
    duration: 0.35,
    ease: [0.25, 0.1, 0.25, 1.0],
  }

  return (
    <div className="min-h-screen flex flex-col bg-wild-black">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-zinc-800 z-50">
        <div 
          className="h-full bg-battle-yellow transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
        ></div>
      </div>
      
      {/* Step content */}
      <AnimatePresence custom={1} mode="wait">
        <motion.div
          key={currentStep}
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="flex-1 flex flex-col"
        >
          {steps[currentStep]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
