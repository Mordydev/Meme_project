'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUIStore } from '@/store/useUIStore';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { springs, bezierCurves } from '@/lib/animations';
import { StaggeredContainer } from '@/components/animations';

interface SidebarProps {
  className?: string;
}

/**
 * EnhancedSidebarNavigation - Enhanced sidebar with polished animations
 * Provides smooth transitions, micro-interactions, and visual enhancements
 */
export function EnhancedSidebarNavigation({ className }: SidebarProps) {
  const pathname = usePathname();
  const sidebarExpanded = useNavigationStore(state => state.sidebarExpanded);
  const toggleSidebar = useNavigationStore(state => state.toggleSidebar);
  const isGroupExpanded = useNavigationStore(state => state.isGroupExpanded);
  const toggleExpandGroup = useNavigationStore(state => state.toggleExpandGroup);
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  const { section, isRouteActive } = useNavigationContext();
  
  // Detect if we're on mobile for different behaviors
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Get authentication state and functions
  const { user, logout } = useAuth();
  
  // Use auth user data if available, otherwise fallback to simulated data
  const userData = user || {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/placeholder-avatar.jpg'
  };
  
  // Top navigation items - consolidated from navigationGroups
  const topNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'market',
      label: 'Market',
      href: '/market',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'create',
      label: 'Create',
      href: '/create',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      ),
    },
    {
      id: 'community',
      label: 'Community',
      href: '/community',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
        </svg>
      ),
      badgeCount: 3, // Example notification
    },
    {
      id: 'rewards',
      label: 'Rewards',
      href: '/rewards',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      href: '/leaderboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.5 2A2.5 2.5 0 003 4.5v15a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4.5A2.5 2.5 0 0010.5 2h-5zM8 5a1 1 0 100 2h1a1 1 0 100-2H8zm4 6a1 1 0 10-2 0v.5a1 1 0 102 0V11zm-4 5a1 1 0 100 2h1a1 1 0 100-2H8z" clipRule="evenodd" />
          <path d="M7 4.5a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM8 17a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1A.5.5 0 018 17zM7 11a1 1 0 011-1h2.5a1 1 0 01.5.9v3a1 1 0 01-1 1h-2.5a.5.5 0 010-1H9v-3H8a1 1 0 01-1-1z" />
        </svg>
      ),
    },
  ];
  
  // Bottom navigation items for settings and user-related actions
  const bottomNavItems = [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'help',
      label: 'Help',
      href: '/help',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM10 6.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];
  
  // Enhanced animation variants for Framer Motion
  const sidebarVariants = {
    expanded: { 
      width: 240,
      transition: { ...springs.responsive, duration: 0.3 }
    },
    collapsed: { 
      width: 70,
      transition: { ...springs.responsive, duration: 0.3 }
    }
  };
  
  const logoVariants = {
    expanded: { 
      opacity: 1, 
      scale: 1,
      x: 0,
      transition: { 
        opacity: { duration: 0.2, delay: 0.1 },
        scale: { duration: 0.3, delay: 0.1 },
        x: { duration: 0.3 }
      }
    },
    collapsed: { 
      opacity: 0, 
      scale: 0.8,
      x: -10,
      transition: { 
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 },
        x: { duration: 0.3 }
      }
    }
  };
  
  // Enhanced stagger effects for menu items
  const containerVariants = {
    expanded: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    collapsed: {
      transition: {
        staggerChildren: 0.02,
        staggerDirection: -1
      }
    }
  };
  
  // User dropdown state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  return (
    <motion.div
      initial={false}
      animate={sidebarExpanded ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      className={cn(
        "flex flex-col h-full",
        "bg-gradient-to-b from-primary-50/80 to-white dark:from-gray-900 dark:to-gray-950",
        "border-r border-gray-200 dark:border-gray-800",
        "overflow-hidden",
        className
      )}
    >
      {/* Sidebar header with logo and toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {sidebarExpanded && (
            <motion.div
              key="logo"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={logoVariants}
              className="flex-grow overflow-hidden"
            >
              <Link href="/" className="text-xl font-bold text-primary">
                Success Kid
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile close button */}
        {isMobile ? (
          <motion.button
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "p-2 rounded-md transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-primary-300"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            onClick={toggleSidebar}
            className={cn(
              "p-2 rounded-md transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-primary-300"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <motion.div
              animate={{ 
                rotate: sidebarExpanded ? 0 : 180,
                transition: { duration: 0.3, ease: bezierCurves.standard }
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </motion.button>
        )}
      </div>
      
      {/* Top navigation section */}
      <div className="flex-grow overflow-y-auto py-4">
        <motion.div 
          className="space-y-1 px-3"
          variants={containerVariants}
          initial={false}
          animate={sidebarExpanded ? "expanded" : "collapsed"}
        >
          <StaggeredContainer staggerDelay={0.04} disabled={!sidebarExpanded}>
            {topNavItems.map((item) => (
              <EnhancedNavItem
                key={item.id}
                item={item}
                expanded={sidebarExpanded}
                active={pathname.includes(item.href)}
              />
            ))}
          </StaggeredContainer>
        </motion.div>
      </div>
      
      {/* Bottom section with user profile and settings */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 pb-6 px-3">
        {/* Settings and help links */}
        <motion.div 
          className="space-y-1 mb-4"
          variants={containerVariants}
          initial={false}
          animate={sidebarExpanded ? "expanded" : "collapsed"}
        >
          <StaggeredContainer staggerDelay={0.04} disabled={!sidebarExpanded}>
            {bottomNavItems.map((item) => (
              <EnhancedNavItem
                key={item.id}
                item={item}
                expanded={sidebarExpanded}
                active={pathname.includes(item.href)}
              />
            ))}
          </StaggeredContainer>
        </motion.div>
        
        {/* User profile dropdown - enhanced with animations */}
        <div className="relative">
          <motion.button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "w-full flex items-center rounded-md p-2",
              "hover:bg-gray-100 dark:hover:bg-gray-800/70",
              "focus:outline-none focus:ring-2 focus:ring-primary-300"
            )}
            whileHover={{ backgroundColor: 'rgba(229, 231, 235, 0.5)' }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="relative flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* Use an actual Avatar component if available */}
              <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
                {userData.name.charAt(0)}
              </div>
            </motion.div>
            
            <AnimatePresence mode="wait">
              {sidebarExpanded && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ 
                    duration: 0.3,
                    ease: bezierCurves.standard
                  }}
                  className="ml-3 flex-grow text-left truncate"
                >
                  <p className="text-sm font-medium">{userData.name}</p>
                  <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {sidebarExpanded && (
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-5 h-5 ml-auto text-gray-400"
                animate={{ rotate: userMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </motion.svg>
            )}
          </motion.button>
          
          {/* Enhanced user dropdown menu */}
          <AnimatePresence>
            {userMenuOpen && sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95, originY: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: bezierCurves.standard }}
                className={cn(
                  "absolute right-0 bottom-full mb-2 z-10 w-56 origin-bottom-right rounded-md",
                  "bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5",
                  "focus:outline-none divide-y divide-gray-100 dark:divide-gray-800"
                )}
              >
                <div className="py-1">
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                  >
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                      </svg>
                      Your Profile
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                  >
                    <Link 
                      href="/settings" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      Settings
                    </Link>
                  </motion.div>
                </div>
                
                <div className="py-1">
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                  >
                    <Link 
                      href="/help" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM10 6.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                      Help & Support
                    </Link>
                  </motion.div>
                </div>
                
                <div className="py-1">
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.2 }}
                  >
                    <button 
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                        <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                      </svg>
                      Sign Out
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced navigation item component with animations
function EnhancedNavItem({ 
  item, 
  expanded, 
  active: providedActive 
}: { 
  item: {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }; 
  expanded: boolean; 
  active: boolean;
}) {
  // Use the navigation context to determine if the route is active
  const { isRouteActive } = useNavigationContext();
  
  // Use provided active state or calculate from route
  const active = providedActive || isRouteActive(item.href);
  
  // Define animation variants within the NavItem component
  const iconVariants = {
    expanded: { marginRight: 12 },
    collapsed: { marginRight: 0 }
  };
  
  const itemVariants = {
    expanded: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: bezierCurves.standard }
    },
    collapsed: { 
      opacity: 0, 
      x: -10,
      transition: { duration: 0.2, ease: bezierCurves.exit }
    }
  };
  
  return (
    <Link 
      href={item.href}
      className={cn(
        "group flex items-center py-2 px-3 rounded-md relative transition-colors duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800/70",
        active 
          ? "bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400" 
          : "text-gray-700 dark:text-gray-300"
      )}
    >
      <motion.div className="relative" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <motion.span 
          variants={iconVariants}
          className={cn(
            "inline-block transition-all",
            active 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
          )}
        >
          {item.icon}
        </motion.span>
        
        {/* Badge indicator with animation */}
        {item.badgeCount && item.badgeCount > 0 && (
          <motion.span 
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 25
            }}
          >
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </motion.span>
        )}
      </motion.div>
      
      <AnimatePresence mode="wait">
        {expanded && (
          <motion.span
            key={`${item.id}-label`}
            variants={itemVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="ml-3 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Active indicator with enhanced animation */}
      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 h-full w-1 bg-primary-500 rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { duration: 0.3 }
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            layout: { duration: 0.3 }
          }}
        />
      )}
    </Link>
  );
}
