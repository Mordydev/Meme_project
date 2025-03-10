'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check if user is new (coming from sign-up)
    const isNewUser = localStorage.getItem('isNewUser')
    
    // Get the redirect URL from query parameters or use default
    const redirectTo = searchParams?.get('redirect_url') || 
                      (isNewUser ? '/onboarding' : '/battle')
    
    // Clear the new user flag
    localStorage.removeItem('isNewUser')
    
    // Redirect to the appropriate page
    router.replace(redirectTo)
  }, [router, searchParams])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-battle-yellow border-t-transparent rounded-full inline-block"></div>
        <p className="mt-4 text-hype-white text-lg">Completing your sign-in...</p>
      </div>
    </div>
  )
}
