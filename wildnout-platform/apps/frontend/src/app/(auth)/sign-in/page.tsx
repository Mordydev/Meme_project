import { SignIn } from '@clerk/nextjs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | Wild 'n Out',
  description: 'Sign in to your Wild 'n Out account',
}

export default function SignInPage() {
  return (
    <div className="w-full">
      <SignIn
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
        path="/sign-in"
        signUpUrl="/sign-up"
        forgotPasswordUrl="/forgot-password"
        redirectUrl="/auth-callback"
      />
    </div>
  )
}
