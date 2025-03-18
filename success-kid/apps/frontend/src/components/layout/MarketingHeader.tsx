'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import tokens from '@/theme/tokens';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Metrics', href: '/metrics' },
  { name: 'About', href: '/about' },
  { name: 'Tokenomics', href: '/tokenomics' },
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
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        isScrolled 
          ? 'bg-white shadow-sm dark:bg-gray-900 dark:border-b dark:border-gray-800' 
          : 'bg-transparent dark:bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Success Kid</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative font-medium text-sm transition-colors ${
                    isActive
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary"
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

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Join Now</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
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
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto h-full flex flex-col">
              <div className="flex items-center justify-between h-16 px-4">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-primary">Success Kid</span>
                </Link>
                <button
                  className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
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
                </button>
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

              <div className="px-4 py-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-4">
                  <Link href="/sign-in" className="w-full">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/sign-up" className="w-full">
                    <Button className="w-full">Join Now</Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
