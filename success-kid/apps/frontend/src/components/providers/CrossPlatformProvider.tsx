'use client';

import { useState, useEffect } from 'react';
import { BrowserCompatibilityWarning } from '../ui/BrowserCompatibilityWarning';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { InstallAppPrompt } from '../ui/InstallAppPrompt';
import { CrossPlatformVerification } from '../platform-verification/CrossPlatformVerification';
import { 
  detectBrowser,
  getFeatureSupportSummary,
  detectDeviceCapabilities
} from '../../lib/browser-compatibility';
import { generatePerformanceConfig, applyPerformanceOptimizations } from '../../lib/performance';
import { registerServiceWorker } from '../../lib/pwa/service-worker-registration';
import { setupOfflineSync } from '../../lib/offline/offline-manager';

interface CrossPlatformProviderProps {
  children: React.ReactNode;
  showDebugTool?: boolean;
}

/**
 * Provider that handles cross-platform optimizations and experience verification
 */
export function CrossPlatformProvider({ 
  children,
  showDebugTool = false
}: CrossPlatformProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDebugger, setShowDebugger] = useState(showDebugTool);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize cross-platform optimizations
    const initialize = async () => {
      try {
        // 1. Detect browser capabilities
        const browser = detectBrowser();
        const featureSupport = getFeatureSupportSummary();
        const deviceCapabilities = detectDeviceCapabilities();

        // 2. Generate and apply performance configuration
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
        const performanceConfig = generatePerformanceConfig(prefersReducedMotion, prefersHighContrast);
        applyPerformanceOptimizations(performanceConfig);

        // 3. Register service worker for PWA capabilities
        if ('serviceWorker' in navigator) {
          const registration = await registerServiceWorker();
          console.log('Service Worker initialized:', !!registration);
        }

        // 4. Set up offline synchronization
        const cleanup = setupOfflineSync(() => {
          console.log('Processing offline actions...');
        });

        // 5. Check for debugging mode
        const urlParams = new URLSearchParams(window.location.search);
        const debug = urlParams.get('debug');
        if (debug === 'platform') {
          setShowDebugger(true);
        }

        // Initialization complete
        setIsInitialized(true);

        // Cleanup function
        return () => {
          cleanup();
        };
      } catch (error) {
        console.error('Error initializing cross-platform optimizations:', error);
        // Still mark as initialized to avoid blocking rendering
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  return (
    <>
      {children}
      
      {/* Cross-platform UI components */}
      <BrowserCompatibilityWarning />
      <OfflineIndicator />
      <InstallAppPrompt />
      
      {/* Debug tool - only shown if enabled */}
      {showDebugger && <CrossPlatformVerification />}
    </>
  );
}
