'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Flame, Plus, Users, Coins } from 'lucide-react'

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export function DesktopNavigation() {
  const pathname = usePathname()
  
  // Don't show navigation on auth pages
  if (pathname?.startsWith('/(auth)')) {
    return null
  }

  const navigationItems: NavigationItem[] = [
    {
      name: 'Battle',
      path: '/battle',
      icon: <Flame size={20} />,
    },
    {
      name: 'Create',
      path: '/create',
      icon: <Plus size={20} />,
    },
    {
      name: 'Community',
      path: '/community',
      icon: <Users size={20} />,
      badge: 3, // Example badge
    },
    {
      name: 'Token',
      path: '/token',
      icon: <Coins size={20} />,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <Trophy size={20} />,
    },
  ]

  return (
    <nav className="hidden md:block fixed left-0 top-0 h-screen w-16 bg-zinc-900 pt-20">
      <div className="flex flex-col items-center space-y-6">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`)
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`relative flex flex-col items-center justify-center px-3 py-2 rounded-lg ${
                isActive ? 'bg-zinc-800 text-battle-yellow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title={item.name}
            >
              <span className="relative">
                {item.icon}
                
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-roast-red text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
