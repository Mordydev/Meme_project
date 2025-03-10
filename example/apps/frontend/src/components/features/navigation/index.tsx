'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Battle', href: '/battle' },
  { name: 'Community', href: '/community' },
  { name: 'Token', href: '/token' },
  { name: 'Profile', href: '/profile' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-wild-black/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center max-w-7xl mx-auto px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-display text-battle-yellow">Wild 'n Out</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex mx-auto space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-battle-yellow",
                pathname === item.href || pathname.startsWith(`${item.href}/`) 
                  ? "text-battle-yellow"
                  : "text-hype-white/70"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center space-x-4">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block py-2 px-3 rounded-md text-base font-medium",
                  pathname === item.href || pathname.startsWith(`${item.href}/`) 
                    ? "bg-zinc-800 text-battle-yellow"
                    : "text-hype-white/70 hover:bg-zinc-800 hover:text-battle-yellow"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
