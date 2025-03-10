import { ForgotPassword } from '@clerk/nextjs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password | Wild 'n Out',
  description: 'Reset your Wild 'n Out account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full">
      <ForgotPassword
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
          }
        }}
        routing="path"
        path="/forgot-password"
        signInUrl="/sign-in"
      />
    </div>
  )
}
