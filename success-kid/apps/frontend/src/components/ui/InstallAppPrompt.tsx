'use client';

import { useState, useEffect } from 'react';
import { 
  canInstallApp, 
  listenForInstallPrompt, 
  showInstallPrompt 
} from '../../lib/pwa/service-worker-registration';

export function InstallAppPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Check if the app is already installed or can't be installed
    if (typeof window === 'undefined') return;
    
    // Check local storage to see if user has dismissed the prompt
    const hasUserDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasUserDismissed) {
      setIsDismissed(true);
      return;
    }
    
    // Initial check
    setIsInstallable(canInstallApp());
    
    // Listen for the install prompt event
    const cleanupListener = listenForInstallPrompt((canInstall) => {
      setIsInstallable(canInstall);
    });
    
    return cleanupListener;
  }, []);
  
  // If not installable or dismissed, don't show anything
  if (!isInstallable || isDismissed) {
    return null;
  }
  
  const handleInstall = async () => {
    const wasInstalled = await showInstallPrompt();
    if (wasInstalled) {
      setIsInstallable(false);
    }
  };
  
  const handleDismiss = () => {
    setIsDismissed(true);
    // Remember user's choice for 7 days
    const date = new Date();
    date.setDate(date.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed', date.toISOString());
  };
  
  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg className="h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Install Success Kid App
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Install our app for a better experience, offline access, and quick access from your home screen.
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleInstall}
            >
              Install
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleDismiss}
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
