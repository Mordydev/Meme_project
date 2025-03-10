'use client'

import { SignUp } from '@clerk/nextjs'
import { Metadata } from 'next'
import { useEffect } from 'react'

export const metadata: Metadata = {
  title: 'Sign Up | Wild 'n Out',
  description: 'Create your Wild 'n Out account',
}

export default function SignUpPage() {
  // Set a flag to indicate that this is a new user
  useEffect(() => {
    localStorage.setItem('isNewUser', 'true')
  }, [])
  
  return (
    <div className="w-full">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 
              'bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black',
            footerActionLink: 
              'text-battle-yellow hover:text-battle-yellow/90',
            card: 'bg-transparent shadow-none',
            headerTitle: 'text-hype-white font-display text-2xl',
            headerSubtitle: 'text-zinc-400',
            formFieldInput: 'bg-zinc-800 border-zinc-700 text-hype-white',
            formFieldLabel: 'text-zinc-400',
            identityPreviewEditButton: 'text-battle-yellow',
            formFieldAction: 'text-battle-yellow',
            socialButtonsBlockButton: 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-hype-white',
            socialButtonsBlockButtonText: 'text-hype-white',
            dividerLine: 'bg-zinc-700',
            dividerText: 'text-zinc-400',
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        redirectUrl="/auth-callback"
      />
    </div>
  )
}
