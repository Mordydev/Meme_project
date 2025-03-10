import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-wild-black">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/design-system" className="text-battle-yellow font-display text-2xl">
              Wild 'n Out Design System
            </Link>
            
            <nav>
              <ul className="flex gap-6">
                <NavLink href="/design-system">Overview</NavLink>
                <NavLink href="/design-system/tokens">Tokens</NavLink>
                <NavLink href="/design-system/components">Components</NavLink>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
      
      <footer className="border-t border-zinc-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          Wild 'n Out Meme Coin Platform &copy; {new Date().getFullYear()} - Design System
        </div>
      </footer>
    </div>
  )
}

function NavLink({ 
  href, 
  children 
}: { 
  href: string, 
  children: React.ReactNode 
}) {
  return (
    <li>
      <Link 
        href={href}
        className={cn(
          "text-hype-white/70 hover:text-hype-white transition-colors",
          "text-sm font-medium px-2 py-1"
        )}
      >
        {children}
      </Link>
    </li>
  )
}
