'use client'

import { Header } from './header'
import { MobileNavigation } from './mobile-navigation'
import { DesktopNavigation } from './desktop-navigation'

interface PlatformShellProps {
  children: React.ReactNode
}

export function PlatformShell({ children }: PlatformShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 md:pl-16">
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNavigation />
      <DesktopNavigation />
    </div>
  )
}
