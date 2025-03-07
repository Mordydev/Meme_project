'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { Trophy, Flame, Plus, Users, Coins } from 'lucide-react'

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export function MobileNavigation() {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  
  // Don't show navigation on auth pages
  if (pathname?.startsWith('/(auth)')) {
    return null
  }

  const navigationItems: NavigationItem[] = [
    {
      name: 'Battle',
      path: '/battle',
      icon: <Flame size={24} />,
    },
    {
      name: 'Create',
      path: '/create',
      icon: <Plus size={24} />,
    },
    {
      name: 'Community',
      path: '/community',
      icon: <Users size={24} />,
      badge: 3, // Example badge
    },
    {
      name: 'Token',
      path: '/token',
      icon: <Coins size={24} />,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <Trophy size={24} />,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-zinc-800 bg-wild-black/90 backdrop-blur-md md:hidden">
      {navigationItems.map((item) => {
        const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`)
        
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`relative flex flex-col items-center py-2 px-3 min-h-[56px] min-w-[64px] justify-center ${
              isActive ? 'text-battle-yellow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isActive && !prefersReducedMotion && (
              <motion.span
                className="absolute -top-1 left-1/2 h-1 w-10 rounded-full bg-battle-yellow"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            
            {isActive && prefersReducedMotion && (
              <span className="absolute -top-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-battle-yellow" />
            )}
            
            <span className="relative">
              {item.icon}
              
              {item.badge && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-roast-red text-xs font-bold text-white">
                  {item.badge}
                </span>
              )}
            </span>
            
            <span className="mt-1 text-xs font-medium">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
