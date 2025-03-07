import { PlatformShell } from '@/components/layout/platform-shell'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { AuthCheck } from './auth-check'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  
  // If not authenticated, redirect to sign in
  if (!userId) {
    redirect('/sign-in')
  }
  
  return <PlatformShell>
    <AuthCheck />
    {children}
  </PlatformShell>
}
