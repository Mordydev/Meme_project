import { Metadata } from 'next'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/features/onboarding/onboarding-flow'

export const metadata: Metadata = {
  title: 'Welcome to Wild 'n Out',
  description: 'Get started with your Wild 'n Out experience',
}

export default function OnboardingPage() {
  const { userId } = auth()
  
  // If not authenticated, redirect to sign in
  if (!userId) {
    redirect('/sign-in')
  }
  
  return <OnboardingFlow />
}
