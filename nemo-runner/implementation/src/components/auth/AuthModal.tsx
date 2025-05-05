'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signOut, isAuthenticated, mockUserSession } from '@/lib/auth/clerkClient';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
}

export default function AuthModal({ isVisible, onClose, onAuthenticated }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // Check authentication status on mount
  useEffect(() => {
    setIsSignedIn(isAuthenticated());
  }, []);
  
  if (!isVisible) return null;
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would validate and authenticate the user
      // We're using a mock implementation that always succeeds
      await signIn();
      setIsSignedIn(true);
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simple validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }
    
    try {
      // In a real implementation, this would create a new user
      // We're using a mock implementation that always succeeds
      await signIn();
      setIsSignedIn(true);
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      await signOut();
      setIsSignedIn(false);
    } catch (err) {
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div 
          className="bg-blue-900/90 p-8 rounded-lg shadow-xl max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          
          {isSignedIn ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome, {mockUserSession.username}!
              </h2>
              <p className="text-blue-100 mb-6">
                You're signed in and ready to play. Daily game limits have been reset.
              </p>
              <div className="flex justify-between gap-4">
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Sign Out
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              
              <div className="flex text-sm border-b border-gray-700 mb-6">
                <button
                  className={`flex-1 text-center pb-2 ${
                    activeTab === 'signin'
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 text-center pb-2 ${
                    activeTab === 'signup'
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setActiveTab('signup')}
                >
                  Create Account
                </button>
              </div>
              
              {error && (
                <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}
              
              {activeTab === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-blue-200 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-950 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 text-sm mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-950 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-blue-200 text-sm mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-950 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Choose a username"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-950 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 text-sm mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-950 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Create a password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
                <p>
                  Sign in to track your progress and get 10 games per day instead of the 1 game limit for anonymous players.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}