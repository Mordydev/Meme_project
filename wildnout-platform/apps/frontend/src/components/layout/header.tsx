'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export function Header() {
  const pathname = usePathname()
  
  // Don't show header on auth pages
  if (pathname?.startsWith('/(auth)')) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-wild-black/90 backdrop-blur-md border-b border-zinc-800">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-display text-xl text-battle-yellow">
            Wild 'n Out
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* Only show user button when authenticated */}
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8",
              }
            }}
          />
        </div>
      </div>
    </header>
  )
}
