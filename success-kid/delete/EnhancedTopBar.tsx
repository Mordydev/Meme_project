'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X, Menu, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUIStore } from '@/store/useUIStore';
import { Logo } from '@/components/ui';
import { SearchBar } from '@/components/features/search';
import { MessagingButton } from '@/components/features/messaging';
import { UserDropdown } from '@/components/features/user';
import { NotificationBell } from '@/components/features/notifications';
import { useAuth } from '@/hooks/useAuth';
import { 
  springs, 
  bezierCurves, 
  fadeVariants, 
  slideDownVariants, 
  slideUpVariants
} from '@/lib/animations';

interface EnhancedTopBarProps {
  className?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
}

/**
 * EnhancedTopBar Component
 * Professional top bar with premium animations and visual effects
 */
export function EnhancedTopBar({ 
  className,
  showBackButton = false,
  showSearch = true
}: EnhancedTopBarProps) {
  // States
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [previousRoutePath, setPreviousRoutePath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Hooks
  const pathname = usePathname();
  const toggleSidebar = useNavigationStore(state => state.toggleSidebar);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  const previousRoute = useNavigationStore(state => state.previousRoute);
  
  // Update previous route path for back button functionality
  useEffect(() => {
    if (previousRoute && previousRoute !== pathname) {
      setPreviousRoutePath(previousRoute);
    }
  }, [previousRoute, pathname]);
  
  // Track scroll position for visual effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Get authentication state and functions
  const { user, logout } = useAuth();
  
  // Use auth user data if available, otherwise fallback to simulated data
  const userData = user || {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/images/placeholder-avatar.jpg',
    initials: 'JD'
  };
  
  // Handle back button click
  const handleBackClick = () => {
    if (previousRoutePath) {
      window.history.back();
    }
  };
  
  return (
    <motion.header 
      className={cn(
        "sticky top-0 z-50 w-full h-16",
        "bg-white/80 dark:bg-gray-950/90",
        "border-b border-neutral-200 dark:border-neutral-800",
        scrolled ? "backdrop-blur-md shadow-sm" : "backdrop-blur-none",
        "transition-all duration-300",
        className
      )}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springs.responsive}
    >
      {/* Premium gradient accent bar */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: bezierCurves.standard }}
      >
        <div className="w-full h-full bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400" />
      </motion.div>
      
      <div className="h-full mx-auto px-4 max-w-screen-2xl grid grid-cols-[auto_1fr_auto] items-center">
        {/* Left section - Logo & Navigation */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button or back button */}
          {showBackButton && previousRoutePath ? (
            <motion.button
              onClick={handleBackClick}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="sr-only md:not-sr-only md:ml-1 text-sm font-medium">Back</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setSidebarOpen(true)}
              className="p-2 md:hidden rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          )}
          
          {/* Desktop sidebar toggle with enhanced animation */}
          <motion.button
            onClick={toggleSidebar}
            className="p-2 hidden md:flex rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle sidebar width"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          
          {/* Animated logo */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Link href="/" className="flex items-center">
              <Logo variant="full" size="md" />
            </Link>
          </motion.div>
        </div>
        
        {/* Center section - Search with enhanced animations */}
        {showSearch && (
          <motion.div 
            className="mx-4 max-w-md w-full justify-self-center hidden sm:block"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <SearchBar />
          </motion.div>
        )}
        
        {/* Right section - Actions with staggered animations */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile search button */}
          {showSearch && (
            <motion.button
              className="p-2 sm:hidden rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileSearchOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          )}
          
          {/* Messaging button with animation */}
          <motion.div 
            className="hidden sm:block"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <MessagingButton variant="compact" />
          </motion.div>
          
          {/* Notifications with animation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <NotificationBell variant="compact" />
          </motion.div>
          
          {/* User menu with animation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.3 }}
          >
            <UserDropdown user={userData} onSignOut={logout} />
          </motion.div>
        </div>
      </div>
      
      {/* Mobile search overlay with enhanced animations */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={slideDownVariants.hidden}
            animate={slideDownVariants.visible}
            exit={slideDownVariants.exit}
            transition={springs.responsive}
            className="absolute inset-x-0 top-0 z-50 h-16 bg-white dark:bg-gray-950 flex items-center px-4"
          >
            <div className="relative flex-1">
              <SearchBar expanded={true} placeholder="Search anything..." />
            </div>
            <motion.button
              className="ml-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileSearchOpen(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default EnhancedTopBar;