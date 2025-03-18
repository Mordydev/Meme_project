'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  CrossPlatformTester, 
  PWAVerifier,
  BrowserCompatibilityChecker,
  OfflineCapabilityTester,
  PerformanceMonitor
} from '@/testing/cross-platform';
import Link from 'next/link';

const FLOW_OPTIONS = [
  { id: 'registration', label: 'Registration & Onboarding', path: '/sign-up' },
  { id: 'content-feed', label: 'Content Feed', path: '/dashboard' },
  { id: 'profile', label: 'User Profile', path: '/profile' },
  { id: 'wallet', label: 'Wallet Connection', path: '/wallet' },
  { id: 'create-post', label: 'Create Post', path: '/create' },
  { id: 'points', label: 'Points Dashboard', path: '/points' },
  { id: 'achievements', label: 'Achievements', path: '/achievements' },
  { id: 'settings', label: 'Settings', path: '/settings' },
];

// Page component for internal cross-platform testing
export default function CrossPlatformTestingPage() {
  const [selectedFlow, setSelectedFlow] = useState<string>(FLOW_OPTIONS[0].id);
  const [iframeSrc, setIframeSrc] = useState<string>(FLOW_OPTIONS[0].path);
  const [activeTab, setActiveTab] = useState<string>('responsive-design');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Handle flow selection
  const handleFlowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const flowId = e.target.value;
    setSelectedFlow(flowId);
    
    const selectedOption = FLOW_OPTIONS.find(option => option.id === flowId);
    if (selectedOption) {
      setIframeSrc(selectedOption.path);
    }
  };
  
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Cross-Platform Experience Verification</h1>
        <p className="text-gray-600">
          Test the application across different devices, screen sizes, network conditions, and offline capabilities.
        </p>
      </div>
      
      {/* Tabs for different testing tools */}
      <div className="mb-6 border-b">
        <div className="flex flex-wrap -mb-px">
          <button
            className={`mr-2 inline-block p-4 ${
              activeTab === 'responsive-design' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('responsive-design')}
          >
            Responsive Design
          </button>
          <button
            className={`mr-2 inline-block p-4 ${
              activeTab === 'browser-compatibility' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('browser-compatibility')}
          >
            Browser Compatibility
          </button>
          <button
            className={`mr-2 inline-block p-4 ${
              activeTab === 'pwa-verification' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pwa-verification')}
          >
            PWA Verification
          </button>
          <button
            className={`mr-2 inline-block p-4 ${
              activeTab === 'offline-capability' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('offline-capability')}
          >
            Offline Capability
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - always visible */}
        <div className="lg:col-span-1 space-y-6">
          {/* Flow Selector */}
          <div className="bg-white border rounded-md p-4">
            <h2 className="font-semibold mb-3">Select User Flow</h2>
            <select
              value={selectedFlow}
              onChange={handleFlowChange}
              className="w-full border rounded-md p-2"
            >
              {FLOW_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-4">
              <Link
                href={iframeSrc}
                target="_blank"
                className="text-sm text-primary-600 hover:underline block"
              >
                Open in new tab →
              </Link>
            </div>
          </div>
          
          {/* Testing Documentation */}
          <div className="bg-white border rounded-md p-4">
            <h2 className="font-semibold mb-3">Testing Guide</h2>
            <div className="space-y-3 text-sm">
              <p>
                Use the tools above to test the selected user flow across different:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Device types (phone, tablet, desktop)</li>
                <li>Screen sizes and orientations</li>
                <li>Network conditions (4G, 3G, offline)</li>
                <li>Touch interactions and accessibility</li>
                <li>Browser compatibility</li>
                <li>Offline capabilities</li>
              </ul>
              <p className="pt-2">
                <strong>Key areas to verify:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Touch targets are at least 44x44px</li>
                <li>Content adapts properly across breakpoints</li>
                <li>App works offline or with poor connectivity</li>
                <li>Interactions are responsive with visual feedback</li>
                <li>PWA installation works correctly</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Main Content - changes based on active tab */}
        <div className="lg:col-span-3">
          {/* Responsive Design Testing */}
          {activeTab === 'responsive-design' && (
            <div className="bg-white border rounded-md">
              <CrossPlatformTester initialMode="device">
                <iframe 
                  ref={iframeRef}
                  src={iframeSrc} 
                  className="w-full h-[calc(100vh-16rem)] bg-white"
                  title="Flow Testing"
                />
              </CrossPlatformTester>
              
              {/* Performance Monitor */}
              <PerformanceMonitor 
                showOverlay={true}
                position="bottom-right"
                refreshRate={1000}
              />
            </div>
          )}
          
          {/* Browser Compatibility Testing */}
          {activeTab === 'browser-compatibility' && (
            <div className="space-y-6">
              <BrowserCompatibilityChecker 
                showControls={true}
                runOnLoad={true}
              />
            </div>
          )}
          
          {/* PWA Verification */}
          {activeTab === 'pwa-verification' && (
            <div className="space-y-6">
              <PWAVerifier 
                manifestUrl="/manifest.json"
                serviceWorkerPath="/sw.js"
                showControls={true}
                runOnLoad={true}
              />
            </div>
          )}
          
          {/* Offline Capability Testing */}
          {activeTab === 'offline-capability' && (
            <div className="space-y-6">
              <OfflineCapabilityTester 
                showControls={true}
                runOnLoad={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
