'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface NetworkProfile {
  name: string;
  description?: string;
  downloadSpeed: number; // kbps
  uploadSpeed: number; // kbps
  latency: number; // ms
  packetLoss: number; // percentage (0-100)
  isOffline?: boolean;
}

// Predefined network profiles
export const NETWORK_PROFILES: NetworkProfile[] = [
  {
    name: 'Online (Default)',
    description: 'Normal network conditions',
    downloadSpeed: Infinity,
    uploadSpeed: Infinity,
    latency: 0,
    packetLoss: 0,
  },
  {
    name: 'Fast 4G',
    description: '20 Mbps, 50ms latency',
    downloadSpeed: 20000,
    uploadSpeed: 10000,
    latency: 50,
    packetLoss: 0,
  },
  {
    name: 'Slow 4G',
    description: '5 Mbps, 100ms latency',
    downloadSpeed: 5000,
    uploadSpeed: 2000,
    latency: 100,
    packetLoss: 0,
  },
  {
    name: '3G',
    description: '1.5 Mbps, 200ms latency',
    downloadSpeed: 1500,
    uploadSpeed: 750,
    latency: 200,
    packetLoss: 0,
  },
  {
    name: '2G',
    description: '450 kbps, 300ms latency',
    downloadSpeed: 450,
    uploadSpeed: 150,
    latency: 300,
    packetLoss: 0,
  },
  {
    name: 'Slow Connection',
    description: '100 kbps, 500ms latency, 10% packet loss',
    downloadSpeed: 100,
    uploadSpeed: 50,
    latency: 500,
    packetLoss: 10,
  },
  {
    name: 'Offline',
    description: 'No network connection',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: Infinity,
    packetLoss: 100,
    isOffline: true,
  },
  {
    name: 'Intermittent',
    description: 'Connection that drops randomly',
    downloadSpeed: 1000,
    uploadSpeed: 500,
    latency: 200,
    packetLoss: 20,
  },
];

// Original implementations of fetch and XMLHttpRequest
const originalFetch = window.fetch;
const OriginalXMLHttpRequest = window.XMLHttpRequest;

interface NetworkSimulatorProps {
  children: ReactNode;
  initialProfile?: NetworkProfile;
  showControls?: boolean;
  profiles?: NetworkProfile[];
  className?: string;
  controlsClassName?: string;
  onProfileChange?: (profile: NetworkProfile) => void;
}

/**
 * A component that simulates different network conditions
 * to test how the application behaves under various scenarios.
 */
export const NetworkSimulator: React.FC<NetworkSimulatorProps> = ({
  children,
  initialProfile = NETWORK_PROFILES[0],
  showControls = true,
  profiles = NETWORK_PROFILES,
  className,
  controlsClassName,
  onProfileChange,
}) => {
  const [activeProfile, setActiveProfile] = useState<NetworkProfile>(initialProfile);
  const [isActive, setIsActive] = useState<boolean>(false);
  
  // Function to apply network simulation
  const applyNetworkSimulation = (profile: NetworkProfile) => {
    // Reset to original implementations
    window.fetch = originalFetch;
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    
    if (!profile || profile === NETWORK_PROFILES[0]) {
      return;
    }
    
    // Override fetch
    window.fetch = async function(...args) {
      // Simulate offline
      if (profile.isOffline) {
        return Promise.reject(new Error('Network request failed'));
      }
      
      // Simulate latency
      if (profile.latency > 0) {
        await new Promise(resolve => setTimeout(resolve, profile.latency));
      }
      
      // Simulate packet loss
      if (profile.packetLoss > 0 && Math.random() * 100 < profile.packetLoss) {
        return Promise.reject(new Error('Network request failed'));
      }
      
      // Proceed with the request
      try {
        const response = await originalFetch.apply(this, args);
        
        // Simulate bandwidth limitation for response
        if (profile.downloadSpeed < Infinity) {
          const clone = response.clone();
          const body = await clone.text();
          
          // Calculate delay based on response size and download speed
          const sizeInKB = body.length / 1024;
          const downloadTimeMs = (sizeInKB / profile.downloadSpeed) * 1000;
          
          if (downloadTimeMs > 0) {
            await new Promise(resolve => setTimeout(resolve, downloadTimeMs));
          }
        }
        
        return response;
      } catch (error) {
        // If the profile simulates offline or has high packet loss, always fail
        if (profile.isOffline || (profile.packetLoss > 50 && Math.random() < 0.5)) {
          return Promise.reject(new Error('Network request failed'));
        }
        throw error;
      }
    };
    
    // Override XMLHttpRequest
    window.XMLHttpRequest = function() {
      const xhr = new OriginalXMLHttpRequest();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(...args) {
        originalOpen.apply(this, args);
      };
      
      xhr.send = function(...args) {
        // Simulate offline
        if (profile.isOffline) {
          setTimeout(() => {
            const event = new Event('error');
            this.dispatchEvent(event);
          }, 10);
          return;
        }
        
        // Simulate latency
        setTimeout(() => {
          // Simulate packet loss
          if (profile.packetLoss > 0 && Math.random() * 100 < profile.packetLoss) {
            const event = new Event('error');
            this.dispatchEvent(event);
            return;
          }
          
          originalSend.apply(this, args);
        }, profile.latency);
      };
      
      return xhr;
    } as any;
  };
  
  // Handle profile changes
  useEffect(() => {
    if (isActive) {
      applyNetworkSimulation(activeProfile);
      onProfileChange?.(activeProfile);
    } else {
      // Reset to original implementations
      window.fetch = originalFetch;
      window.XMLHttpRequest = OriginalXMLHttpRequest;
    }
    
    // Clean up on unmount
    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest = OriginalXMLHttpRequest;
    };
  }, [activeProfile, isActive, onProfileChange]);
  
  // Handle profile selection
  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profile = profiles.find(p => p.name === e.target.value) || profiles[0];
    setActiveProfile(profile);
  };
  
  // Toggle simulation
  const toggleSimulation = () => {
    setIsActive(!isActive);
  };
  
  return (
    <div className={cn('network-simulator', className)}>
      {/* Controls */}
      {showControls && (
        <div className={cn(
          'network-simulator-controls p-3 bg-gray-100 border rounded-md mb-4',
          controlsClassName
        )}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable-simulation"
                checked={isActive}
                onChange={toggleSimulation}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="enable-simulation" className="text-sm font-medium">
                Enable Network Simulation
              </label>
            </div>
            
            <div className="flex-grow">
              <select
                value={activeProfile.name}
                onChange={handleProfileChange}
                disabled={!isActive}
                className={cn(
                  'w-full px-3 py-1 border rounded text-sm',
                  !isActive && 'opacity-50 cursor-not-allowed'
                )}
              >
                {profiles.map(profile => (
                  <option key={profile.name} value={profile.name}>
                    {profile.name} {profile.description ? `(${profile.description})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {isActive && (
            <div className="network-info mt-2 text-xs text-gray-600">
              <p className="font-semibold mb-1">Active Profile: {activeProfile.name}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>Download: {activeProfile.downloadSpeed === Infinity ? 'Unlimited' : `${activeProfile.downloadSpeed} kbps`}</div>
                <div>Upload: {activeProfile.uploadSpeed === Infinity ? 'Unlimited' : `${activeProfile.uploadSpeed} kbps`}</div>
                <div>Latency: {activeProfile.latency === Infinity ? 'Unlimited' : `${activeProfile.latency} ms`}</div>
                <div>Packet Loss: {activeProfile.packetLoss}%</div>
              </div>
              <div className="mt-1 text-xs text-red-500">
                Note: This simulation affects all network requests in the application.
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Status indicator */}
      {isActive && (
        <div className={cn(
          'fixed right-4 top-4 px-2 py-1 rounded-full text-xs z-50',
          activeProfile.isOffline ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
        )}>
          {activeProfile.isOffline ? 'Offline Mode' : `${activeProfile.name} Simulation`}
        </div>
      )}
      
      {/* Content */}
      {children}
    </div>
  );
};

export default NetworkSimulator;