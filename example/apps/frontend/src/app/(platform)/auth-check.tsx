'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export function AuthCheck() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    if (!isLoaded) return
    
    // Skip if not logged in or on onboarding page
    if (!user || pathname === '/onboarding') return
    
    // Check if we have onboarding state in localStorage
    try {
      const onboardingData = localStorage.getItem('onboardingState')
      if (onboardingData) {
        const data = JSON.parse(onboardingData)
        // If onboarding is not complete, redirect to onboarding
        if (!data.onboardingComplete && pathname !== '/onboarding') {
          router.push('/onboarding')
        }
      } else {
        // No onboarding data found, redirect to onboarding
        if (pathname !== '/onboarding') {
          router.push('/onboarding')
        }
      }
    } catch (error) {
      console.error('Error checking onboarding state:', error)
    }
  }, [isLoaded, user, router, pathname])
  
  return null
}
