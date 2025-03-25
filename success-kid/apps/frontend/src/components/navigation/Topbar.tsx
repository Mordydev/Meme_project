'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { UserButton } from '@/components/ui/UserButton';
import { SearchIcon, MessageSquareIcon, BellIcon, MenuIcon } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import MessagesDropdown from './MessagesDropdown';
import QuickLinksDropdown from './QuickLinksDropdown';
import SearchBar from './SearchBar';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEnhancedAuth } from '@/components/auth/providers/AuthProvider';

export function Topbar() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { isSignedIn } = useEnhancedAuth();
  const pathname = usePathname();
  
  // Determine if we're on an authenticated route
  const isAuthenticatedRoute = pathname.includes('/(platform)') || 
    (isSignedIn && !pathname.includes('/(marketing)') && !pathname.includes('/(auth)'));

  // Search expansion handler
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Area */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="hidden font-display text-lg font-semibold sm:inline-block">
              Success Kid
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden gap-1 md:flex md:flex-1 md:justify-center md:px-8">
          <AnimatePresence initial={false} mode="wait">
            {isSearchExpanded ? (
              <motion.div 
                key="expanded-search"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="relative w-full max-w-xl"
              >
                <SearchBar onClose={() => setIsSearchExpanded(false)} />
              </motion.div>
            ) : (
              <motion.div 
                key="collapsed-search"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="relative flex items-center"
              >
                <button
                  onClick={toggleSearch}
                  className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80"
                >
                  <SearchIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Search...</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions Area */}
        <div className="flex items-center gap-1">
          {/* Mobile Search Icon */}
          <button
            onClick={toggleSearch}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          {/* Quick Links - Desktop Only */}
          {isAuthenticatedRoute && (
            <div className="hidden md:block">
              <QuickLinksDropdown />
            </div>
          )}

          {/* Messages - For authenticated users */}
          {isAuthenticatedRoute && (
            <div className="relative">
              <MessagesDropdown />
            </div>
          )}

          {/* Notifications - For authenticated users */}
          {isAuthenticatedRoute && (
            <div className="relative">
              <NotificationsDropdown />
            </div>
          )}

          {/* User Menu Button */}
          <UserButton />

          {/* Mobile Menu Button - appears in tablet/mobile */}
          <button
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted lg:hidden"
            aria-label="Toggle mobile menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchExpanded && (
          <motion.div 
            className="fixed inset-0 z-40 bg-background md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4">
              <SearchBar onClose={() => setIsSearchExpanded(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
