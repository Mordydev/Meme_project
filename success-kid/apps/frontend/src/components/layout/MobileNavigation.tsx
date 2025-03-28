'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigationStore, NavTab } from '@/store/useNavigationStore';

interface NavItemProps {
  id: NavTab;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeCount?: number;
  active: boolean;
}

/**
 * MobileNavigation - Mobile-optimized bottom navigation bar
 * Provides touch-friendly access to primary navigation sections
 * Synchronized with sidebar navigation for consistency
 */
export function MobileNavigation() {
  const pathname = usePathname();
  const setActiveMobileTab = useNavigationStore(state => state.setActiveMobileTab);
  const activeMobileTab = useNavigationStore(state => state.getActiveMobileTab());
  
  // Navigation items - synchronized with sidebar navigation
  // Note: The leaderboard has been removed as per requirements
  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'market' as NavTab,
      label: 'Market',
      href: '/market',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'create' as NavTab,
      label: 'Create',
      href: '/create',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      ),
    },
    {
      id: 'community' as NavTab,
      label: 'Community',
      href: '/community',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96a2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
        </svg>
      ),
      badgeCount: 3, // Example notification
    },
    {
      id: 'rewards' as NavTab,
      label: 'Rewards',
      href: '/rewards',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];
  
  // Handle tab selection
  const handleTabSelect = (tabId: NavTab) => {
    setActiveMobileTab(tabId);
  };
  
  // Derive active tab from pathname
  const getActiveTabFromPathname = (path: string): NavTab => {
    if (path.includes('/dashboard')) return 'home';
    if (path.includes('/market')) return 'market';
    if (path.includes('/create')) return 'create';
    if (path.includes('/community')) return 'community';
    if (path.includes('/rewards')) return 'rewards';
    if (path.includes('/profile')) return 'profile';
    return 'home'; // Default
  };
  
  // Current active tab
  const currentTab = activeMobileTab || getActiveTabFromPathname(pathname);
  
  return (
    <div className="h-16 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={item.href}
            icon={item.icon}
            badgeCount={item.badgeCount}
            active={currentTab === item.id}
          />
        ))}
      </div>
    </div>
  );
}

// Individual navigation item component
function NavItem({ id, label, href, icon, badgeCount, active }: NavItemProps) {
  const setActiveMobileTab = useNavigationStore(state => state.setActiveMobileTab);
  
  return (
    <Link
      href={href}
      onClick={() => setActiveMobileTab(id)}
      className={cn(
        "relative flex flex-col items-center justify-center px-1",
        "transition-colors duration-300 ease-in-out",
        "hover:bg-gray-50 dark:hover:bg-gray-900",
        active 
          ? "text-primary" 
          : "text-gray-500 dark:text-gray-400"
      )}
    >
      <div className="relative">
        {icon}
        
        {/* Badge indicator */}
        {badgeCount && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      
      <span className="text-xs mt-1">{label}</span>
      
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute bottom-0 w-10 h-1 bg-primary rounded-t-full"
          transition={{ duration: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}
