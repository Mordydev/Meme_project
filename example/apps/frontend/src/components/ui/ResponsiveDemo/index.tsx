'use client';

import React, { useRef } from 'react';
import { Container, Grid, Stack, useResponsive } from '@/components/layout';
import { TouchButton } from '@/components/ui/TouchButton';
import { cn } from '@/lib/utils';
import { 
  useTouch, 
  useTapArea, 
  useThumbZone, 
  useDeviceCapabilities,
  useOrientation,
  useVirtualKeyboard
} from '@/hooks/touch';

/**
 * ResponsiveDemo component that showcases responsive layout, touch optimization,
 * and device-specific enhancements in one comprehensive example
 */
export const ResponsiveDemo = () => {
  const { device, breakpoint, isMobile, isTablet, isDesktop } = useResponsive();
  const { isTouchDevice } = useTouch();
  const { getTapAreaProps } = useTapArea();
  const { isPortrait, isLandscape } = useOrientation();
  const { isOpen: isKeyboardOpen, height: keyboardHeight } = useVirtualKeyboard();
  const deviceCapabilities = useDeviceCapabilities();
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <Container size="md" className="py-6">
      <Stack space={6}>
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display mb-2">
            Wild 'n Out Responsive Demo
          </h1>
          <p className="text-zinc-300">
            Showcasing layout system, touch optimization, and device enhancements
          </p>
        </div>
        
        {/* Device Information Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6">
          <h2 className="text-xl font-display mb-4">Device Information</h2>
          
          <Grid cols={{ default: 1, md: 2 }} gap={4}>
            <Stack space={3}>
              <div>
                <p className="text-zinc-400 text-sm">Device Type</p>
                <p className="text-hype-white font-medium">
                  {device} ({breakpoint})
                </p>
              </div>
              
              <div>
                <p className="text-zinc-400 text-sm">Touch Capability</p>
                <p className="text-hype-white font-medium">
                  {isTouchDevice ? 'Touch Enabled' : 'No Touch Support'}
                </p>
              </div>
              
              <div>
                <p className="text-zinc-400 text-sm">Orientation</p>
                <p className="text-hype-white font-medium">
                  {isPortrait ? 'Portrait' : 'Landscape'}
                </p>
              </div>
              
              <div>
                <p className="text-zinc-400 text-sm">System Preferences</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    deviceCapabilities.prefersReducedMotion 
                      ? "bg-flow-blue/30 text-flow-blue"
                      : "bg-zinc-800 text-zinc-400"
                  )}>
                    Reduced Motion: {deviceCapabilities.prefersReducedMotion ? 'On' : 'Off'}
                  </span>
                  
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    deviceCapabilities.prefersColorScheme === 'dark'
                      ? "bg-flow-blue/30 text-flow-blue"
                      : "bg-zinc-800 text-zinc-400"
                  )}>
                    Theme: {deviceCapabilities.prefersColorScheme}
                  </span>
                </div>
              </div>
            </Stack>
            
            <Stack space={3}>
              {/* Responsive Layout Demonstration */}
              <div>
                <p className="text-zinc-400 text-sm">Responsive Layout</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div 
                      key={item}
                      className="bg-zinc-800 h-12 rounded flex items-center justify-center"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Container Query Demonstration */}
              <div className="@container">
                <p className="text-zinc-400 text-sm">Container Queries</p>
                <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div 
                      key={item}
                      className="bg-zinc-800 h-12 rounded flex items-center justify-center"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Stack>
          </Grid>
        </div>
        
        {/* Touch Optimization Demo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6">
          <h2 className="text-xl font-display mb-4">Touch Optimization</h2>
          
          <Stack space={4}>
            <div>
              <p className="text-zinc-400 text-sm mb-2">Touch-Optimized Buttons</p>
              <div className="flex flex-wrap gap-3">
                <TouchButton variant="primary">Primary</TouchButton>
                <TouchButton variant="secondary">Secondary</TouchButton>
                <TouchButton variant="outline">Outline</TouchButton>
                <TouchButton variant="ghost">Ghost</TouchButton>
              </div>
            </div>
            
            <div>
              <p className="text-zinc-400 text-sm mb-2">Keyboard Handling</p>
              <div className="flex flex-col gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Focus to test virtual keyboard"
                  className="bg-zinc-800 rounded-md border border-zinc-700 px-3 py-2 min-h-[44px]"
                />
                <p className="text-xs text-zinc-400">
                  {isKeyboardOpen 
                    ? `Virtual keyboard is open (height: ~${keyboardHeight}px)` 
                    : 'Virtual keyboard is closed'}
                </p>
              </div>
            </div>
          </Stack>
        </div>
        
        {/* Device-Specific Optimizations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6">
          <h2 className="text-xl font-display mb-4">Device-Specific Enhancements</h2>
          
          <Grid cols={{ default: 1, md: 2 }} gap={4}>
            <div>
              <p className="text-zinc-400 text-sm mb-2">OS-Specific Rendering</p>
              <div className={cn(
                "p-4 rounded-lg border",
                deviceCapabilities.isIOS 
                  ? "bg-zinc-800/50 border-flow-blue/50"
                  : deviceCapabilities.isAndroid
                  ? "bg-zinc-800/50 border-victory-green/50"
                  : "bg-zinc-800/50 border-zinc-700"
              )}>
                {deviceCapabilities.isIOS && (
                  <p>iOS-Optimized Interface Elements</p>
                )}
                {deviceCapabilities.isAndroid && (
                  <p>Android-Optimized Interface Elements</p>
                )}
                {!deviceCapabilities.isIOS && !deviceCapabilities.isAndroid && (
                  <p>Desktop-Optimized Interface Elements</p>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-zinc-400 text-sm mb-2">Input Method</p>
              <div className={cn(
                "p-4 rounded-lg border",
                isTouchDevice 
                  ? "bg-zinc-800/50 border-battle-yellow/50"
                  : "bg-zinc-800/50 border-zinc-700"
              )}>
                {isTouchDevice ? (
                  <p>Touch-Optimized Controls Active</p>
                ) : (
                  <p>Pointer-Optimized Controls Active</p>
                )}
              </div>
            </div>
          </Grid>
          
          {/* PWA Installation Banner (simulated) */}
          {!deviceCapabilities.isPWAInstalled && (
            <div className="mt-4 bg-flow-blue/20 border border-flow-blue rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Get the Wild 'n Out App</p>
                <p className="text-sm text-zinc-300">Install for the best experience</p>
              </div>
              <TouchButton variant="primary">Install App</TouchButton>
            </div>
          )}
        </div>
      </Stack>
    </Container>
  );
};

export default ResponsiveDemo;
