'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegistrationFormProps {
  className?: string;
  inlineStyle?: boolean;
  redirectUrl?: string;
}

export function RegistrationForm({ 
  className = '', 
  inlineStyle = false,
  redirectUrl = '/dashboard'
}: RegistrationFormProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This is a mock registration handler - in a real implementation, 
      // we would integrate with Clerk authentication here
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulate successful registration
      console.log('Registration successful', { email, username, password });
      
      // Redirect to the dashboard or onboarding flow
      router.push(redirectUrl);
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Form variants for animation
  const formVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Step transition variants
  const stepVariants = {
    enter: { 
      opacity: prefersReducedMotion ? 1 : 0,
      x: prefersReducedMotion ? 0 : 50
    },
    center: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: prefersReducedMotion ? 1 : 0,
      x: prefersReducedMotion ? 0 : -50,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Social sign-up options
  const socialOptions = [
    { name: 'Google', icon: '🔍', color: 'bg-white border-gray-200 text-gray-800' },
    { name: 'Twitter', icon: '🐦', color: 'bg-white border-gray-200 text-gray-800' },
    { name: 'Discord', icon: '🎮', color: 'bg-white border-gray-200 text-gray-800' }
  ];
  
  return (
    <motion.div
      className={`${className} ${
        inlineStyle 
          ? 'bg-white rounded-lg border border-gray-200 shadow-sm p-6' 
          : ''
      }`}
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      {!inlineStyle && (
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">
            Join our community and start earning rewards
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Email + Social Options */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial="enter"
            animate="center"
            exit="exit"
            variants={stepVariants}
          >
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-sm text-gray-500">or continue with</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                {socialOptions.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    className={`${option.color} border px-4 py-2 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors`}
                    onClick={() => {
                      // Mock social authentication
                      console.log(`${option.name} authentication`);
                    }}
                  >
                    <span className="mr-2">{option.icon}</span>
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!email}
            >
              Continue
            </Button>
          </motion.div>
        )}
        
        {/* Step 2: Username + Password */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial="enter"
            animate="center"
            exit="exit"
            variants={stepVariants}
          >
            <div className="mb-4">
              <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be your public display name
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={!username || !password || isLoading}
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </div>
          </motion.div>
        )}
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
      
      <div className="mt-6 text-xs text-center text-gray-500">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </div>
    </motion.div>
  );
}
