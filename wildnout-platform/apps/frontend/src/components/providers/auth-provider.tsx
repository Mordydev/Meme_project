'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#E9E336', // battle-yellow
          colorBackground: '#121212', // wild-black
          colorText: '#FFFFFF', // hype-white
          colorInputBackground: '#1f1f1f',
          colorInputText: '#FFFFFF',
          colorTextOnPrimaryBackground: '#121212', // wild-black on battle-yellow
        },
        elements: {
          formButtonPrimary: 
            'bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black',
          footerActionLink: 
            'text-battle-yellow hover:text-battle-yellow/90',
          card: 'bg-zinc-900',
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
}
