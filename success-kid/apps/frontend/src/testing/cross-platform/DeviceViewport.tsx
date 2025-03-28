'use client';

import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  devicePixelRatio: number;
  userAgent: string;
  type: 'mobile' | 'tablet' | 'desktop';
}

// Common device presets
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    type: 'mobile'
  },
  {
    name: 'iPhone 13/14',
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    type: 'mobile'
  },
  {
    name: 'Samsung Galaxy S21',
    width: 360,
    height: 800,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36',
    type: 'mobile'
  },
  {
    name: 'iPad',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    type: 'tablet'
  },
  {
    name: 'Desktop',
    width: 1280,
    height: 800,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36',
    type: 'desktop'
  },
  {
    name: 'Large Desktop',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36',
    type: 'desktop'
  }
];

export interface DeviceViewportProps {
  children: ReactNode;
  preset?: DevicePreset;
  customWidth?: number;
  customHeight?: number;
  showDeviceFrame?: boolean;
  showControls?: boolean;
  orientation?: 'portrait' | 'landscape';
  presets?: DevicePreset[];
  onViewportChange?: (preset: DevicePreset, orientation: 'portrait' | 'landscape') => void;
  className?: string;
}

/**
 * A component that renders content within a simulated device viewport
 * for cross-platform testing and verification.
 */
export const DeviceViewport: React.FC<DeviceViewportProps> = ({
  children,
  preset = DEVICE_PRESETS[1], // Default to iPhone 13/14
  customWidth,
  customHeight,
  showDeviceFrame = true,
  showControls = true,
  orientation = 'portrait',
  presets = DEVICE_PRESETS,
  onViewportChange,
  className,
}) => {
  const [currentPreset, setCurrentPreset] = useState<DevicePreset>(preset);
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>(orientation);
  
  // Calculate dimensions based on orientation
  const width = customWidth || (currentOrientation === 'portrait' ? currentPreset.width : currentPreset.height);
  const height = customHeight || (currentOrientation === 'portrait' ? currentPreset.height : currentPreset.width);
  
  // Handle preset change
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = presets.find(p => p.name === e.target.value) || presets[0];
    setCurrentPreset(selectedPreset);
    onViewportChange?.(selectedPreset, currentOrientation);
  };
  
  // Handle orientation change
  const handleOrientationChange = () => {
    const newOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
    setCurrentOrientation(newOrientation);
    onViewportChange?.(currentPreset, newOrientation);
  };
  
  return (
    <div className={cn('device-viewport-container flex flex-col items-center', className)}>
      {/* Controls */}
      {showControls && (
        <div className="device-controls flex flex-wrap gap-4 justify-center items-center mb-4 p-2 border rounded-md bg-gray-50 w-full max-w-lg">
          <div className="flex flex-col">
            <label htmlFor="device-preset" className="text-sm font-medium mb-1">Device</label>
            <select 
              id="device-preset"
              value={currentPreset.name}
              onChange={handlePresetChange}
              className="border rounded px-2 py-1 text-sm"
            >
              {presets.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="orientation" className="text-sm font-medium mb-1">Orientation</label>
            <button
              onClick={handleOrientationChange}
              className="border rounded px-3 py-1 text-sm bg-white"
            >
              {currentOrientation === 'portrait' ? 'Switch to Landscape' : 'Switch to Portrait'}
            </button>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium mb-1">Dimensions</span>
            <span className="text-sm">{width} × {height}</span>
          </div>
        </div>
      )}
      
      {/* Device frame */}
      <div 
        className={cn(
          'device-frame relative overflow-hidden transition-all duration-300',
          showDeviceFrame && 'border-4 border-gray-800 rounded-2xl', 
          currentPreset.type === 'mobile' && showDeviceFrame && 'rounded-3xl',
          currentOrientation === 'landscape' && 'rotate-90'
        )}
        style={{ 
          width: showDeviceFrame ? width + 24 : width,
          height: showDeviceFrame ? height + 24 : height,
          transform: currentOrientation === 'landscape' ? 'rotate(-90deg)' : undefined,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPreset.name}-${currentOrientation}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="device-content bg-white overflow-y-auto"
            style={{ 
              width,
              height,
              margin: showDeviceFrame ? '12px' : 0,
              transformOrigin: 'center center',
            }}
          >
            {/* Simulated status bar for mobile */}
            {currentPreset.type === 'mobile' && showDeviceFrame && (
              <div className="status-bar h-6 bg-black text-white flex items-center justify-between px-3 text-xs">
                <span>9:41 AM</span>
                <div className="flex space-x-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
            )}
            
            {/* Content */}
            <div 
              className="device-content-wrapper"
              style={{ 
                height: currentPreset.type === 'mobile' && showDeviceFrame ? height - 24 : height,
                overflow: 'auto',
                transformOrigin: 'top left',
              }}
            >
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Device info */}
      {showDeviceFrame && (
        <div className="device-info mt-2 text-sm text-gray-500">
          {currentPreset.name} • {currentOrientation} • {width}×{height} • {currentPreset.devicePixelRatio}x
        </div>
      )}
    </div>
  );
};

export default DeviceViewport;