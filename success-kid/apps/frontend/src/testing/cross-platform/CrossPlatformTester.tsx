'use client';

import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { DeviceViewport, DevicePreset, DEVICE_PRESETS } from './DeviceViewport';
import { NetworkSimulator, NetworkProfile, NETWORK_PROFILES } from './NetworkSimulator';
import { ResponsiveTestGrid } from './ResponsiveTestGrid';
import { TouchTargetTester } from './TouchTargetTester';

type TestMode = 'device' | 'responsive' | 'touch' | 'network' | 'all';

export interface CrossPlatformTesterProps {
  children: ReactNode;
  initialMode?: TestMode;
  defaultDevice?: DevicePreset;
  defaultOrientation?: 'portrait' | 'landscape';
  defaultNetworkProfile?: NetworkProfile;
  className?: string;
}

/**
 * A comprehensive testing dashboard for cross-platform verification.
 * Combines device simulation, responsive testing, touch testing,
 * and network simulation in one component.
 */
export const CrossPlatformTester: React.FC<CrossPlatformTesterProps> = ({
  children,
  initialMode = 'device',
  defaultDevice = DEVICE_PRESETS[1], // iPhone 13/14
  defaultOrientation = 'portrait',
  defaultNetworkProfile = NETWORK_PROFILES[0], // Normal
  className,
}) => {
  const [testMode, setTestMode] = useState<TestMode>(initialMode);
  const [device, setDevice] = useState<DevicePreset>(defaultDevice);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation);
  const [networkProfile, setNetworkProfile] = useState<NetworkProfile>(defaultNetworkProfile);
  
  const [touchWarnings, setTouchWarnings] = useState<{ count: number, elements: Element[] }>({
    count: 0,
    elements: [],
  });
  
  // Handle device change
  const handleDeviceChange = (newDevice: DevicePreset, newOrientation: 'portrait' | 'landscape') => {
    setDevice(newDevice);
    setOrientation(newOrientation);
  };
  
  // Handle network profile change
  const handleNetworkChange = (profile: NetworkProfile) => {
    setNetworkProfile(profile);
  };
  
  // Handle touch target warning
  const handleTouchWarning = (element: Element) => {
    setTouchWarnings(prev => ({
      count: prev.count + 1,
      elements: [...prev.elements, element],
    }));
  };
  
  // Reset touch warnings
  const resetTouchWarnings = () => {
    setTouchWarnings({ count: 0, elements: [] });
  };
  
  // Toggle showAll mode
  const toggleAllMode = () => {
    setTestMode(testMode === 'all' ? 'device' : 'all');
  };
  
  return (
    <div className={cn('cross-platform-tester', className)}>
      {/* Controls */}
      <div className="test-controls sticky top-0 z-50 bg-white border-b p-3 flex flex-wrap items-center gap-3">
        <div className="font-medium text-sm">Cross-Platform Tester</div>
        
        <div className="flex space-x-1">
          {(['device', 'responsive', 'touch', 'network'] as TestMode[]).map((mode) => (
            <button
              key={mode}
              className={cn(
                'px-3 py-1 text-sm rounded-md',
                testMode === mode || testMode === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              )}
              onClick={() => setTestMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={testMode === 'all'}
              onChange={toggleAllMode}
              className="mr-2 h-4 w-4"
            />
            <span className="text-sm">Show All Tools</span>
          </label>
        </div>
      </div>
      
      {/* Testing content */}
      <div className="test-content p-4">
        {/* Device Viewport */}
        {(testMode === 'device' || testMode === 'all') && (
          <div className="device-test mb-8">
            <h2 className="text-lg font-medium mb-2">Device Simulation</h2>
            <DeviceViewport
              preset={device}
              orientation={orientation}
              onViewportChange={handleDeviceChange}
              showDeviceFrame
              showControls
            >
              {children}
            </DeviceViewport>
          </div>
        )}
        
        {/* Responsive Grid */}
        {(testMode === 'responsive' || testMode === 'all') && (
          <div className="responsive-test mb-8">
            <h2 className="text-lg font-medium mb-2">Responsive Layout Testing</h2>
            <div className="border rounded-md overflow-hidden">
              <ResponsiveTestGrid
                showBreakpointIndicators
                showCurrentBreakpoint
                showGrid
              >
                {children}
              </ResponsiveTestGrid>
            </div>
          </div>
        )}
        
        {/* Touch Target Testing */}
        {(testMode === 'touch' || testMode === 'all') && (
          <div className="touch-test mb-8">
            <h2 className="text-lg font-medium mb-2">Touch Target Testing</h2>
            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <p className="text-sm text-gray-700 mb-2">
                Touch or click elements to test their size. Elements smaller than 44×44px will be flagged.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Warnings: <span className="font-medium">{touchWarnings.count}</span>
                </div>
                <button
                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                  onClick={resetTouchWarnings}
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="border rounded-md overflow-hidden">
              <TouchTargetTester
                showOverlay
                highlightTargets
                showWarnings
                minTargetSize={44}
                onTargetWarning={(element) => handleTouchWarning(element)}
              >
                {children}
              </TouchTargetTester>
            </div>
          </div>
        )}
        
        {/* Network Simulation */}
        {(testMode === 'network' || testMode === 'all') && (
          <div className="network-test mb-8">
            <h2 className="text-lg font-medium mb-2">Network Condition Testing</h2>
            <NetworkSimulator
              initialProfile={networkProfile}
              onProfileChange={handleNetworkChange}
              showControls
            >
              <div className="border rounded-md p-4">
                {children}
              </div>
            </NetworkSimulator>
          </div>
        )}
        
        {/* Normal mode when no specific test is selected */}
        {testMode !== 'all' && testMode !== 'device' && testMode !== 'responsive' && testMode !== 'touch' && testMode !== 'network' && (
          <div className="normal-view">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossPlatformTester;