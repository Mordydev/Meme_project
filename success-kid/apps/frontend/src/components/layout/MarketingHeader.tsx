'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { motion, AnimatePresence } from 'framer-motion';
import tokens from '@/theme/tokens';

const navLinks = [
  { name: 'Home', href: '/home' },
  { name: 'About', href: '/about' },
  { name: 'Market', href: '/markets' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Community', href: '/community' },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check in case page loads scrolled
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header 
      className={`sticky top-0 z-40 w-full transition-all duration-500 relative ${
        isScrolled 
          ? 'glass-effect dark:border-b dark:border-gray-800/50' 
          : 'bg-transparent dark:bg-transparent'
      }`}
    >
      {/* Glowing border effect when scrolled */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/70 to-transparent"
        style={{ 
          boxShadow: '0 1px 12px 0.5px rgba(30, 136, 229, 0.35)',
          filter: 'drop-shadow(0 1px 2px rgba(30, 136, 229, 0.4))'
        }}
        initial={{ opacity: 0, width: '0%', left: '50%' }}
        animate={{ 
          opacity: isScrolled ? 1 : 0, 
          width: isScrolled ? '100%' : '0%', 
          left: isScrolled ? '0%' : '50%' 
        }}
        transition={{ 
          duration: 0.6, 
          ease: [0.19, 1.0, 0.22, 1.0] /* Expo ease-out for smooth animation */
        }}
      />

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-2 group">
          <motion.span 
                className="text-2xl font-bold text-primary group-hover:text-primary-600 transition-colors"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                Success Kid
              </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative font-medium text-sm transition-colors hover:scale-105 ${
                    isActive
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-600"
                      layoutId="activeNavIndicator"
                      transition={{ 
                        type: "spring", 
                        duration: 0.5,
                        bounce: 0.2,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons with Enhanced Effects */}
          <div className="hidden md:flex items-center space-x-4 ml-4">
            <EnhancedButton 
              variant="glass" 
              href="/sign-in"
              size="md"
              shine={false}
              glow={true}
            >
              Sign In
            </EnhancedButton>
            <EnhancedButton 
              variant="primary"
              href="/sign-up"
              shine={true}
              glow={true}
            >
              Join Now
            </EnhancedButton>
          </div>

          {/* Mobile Menu Button with Motion */}
          <motion.button
            className="md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 20 
            }}
          >
            <svg
              className="h-6 w-6 text-gray-700 dark:text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu with Glass Effect */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 glass-effect"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto h-full flex flex-col">
            <div className="flex items-center justify-between h-16 px-4">
            <Link href="/home" className="flex items-center space-x-2 group">
            <motion.span 
                  className="text-2xl font-bold text-primary group-hover:text-primary-600 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  Success Kid
                </motion.span>
            </Link>
                <motion.button
                  className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 20 
                  }}
                >
                  <svg
                    className="h-6 w-6 text-gray-700 dark:text-gray-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <nav className="flex-1 px-4 py-8 overflow-y-auto">
                <ul className="space-y-6">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`block text-xl font-semibold transition-colors ${
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="px-4 py-8 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  <EnhancedButton 
                    variant="glass" 
                    href="/sign-in"
                    fullWidth={true}
                    shine={false}
                    glow={true}
                  >
                    Sign In
                  </EnhancedButton>
                  <EnhancedButton 
                    variant="primary"
                    href="/sign-up"
                    fullWidth={true}
                    shine={true}
                    glow={true}
                  >
                    Join Now
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
