'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth Layout - Provides consistent branding and animations for authentication screens
 * Used for login, signup, and other authentication-related pages
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 p-4">
      {/* Logo and branding */}
      <motion.div 
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Logo variant="full" size="lg" className="mb-2" />
        <motion.p 
          className="text-gray-600 dark:text-gray-400 text-sm md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Clench Your Fist, Claim Your Success!
        </motion.p>
      </motion.div>
      
      {/* Auth content with animation */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {children}
      </motion.div>
      
      {/* Footer */}
      <motion.div 
        className="mt-8 text-center text-xs text-gray-500 dark:text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p>© {new Date().getFullYear()} Success Kid Community Platform</p>
        <p className="mt-1">
          <a href="/terms" className="hover:underline mx-2">Terms of Service</a>
          <a href="/privacy" className="hover:underline mx-2">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
}
