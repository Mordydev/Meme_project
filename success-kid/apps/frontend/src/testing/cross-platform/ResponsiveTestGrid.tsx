'use client';

import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Breakpoint {
  name: string;
  width: number;
  color?: string;
}

// Default breakpoints based on Tailwind's defaults
export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: 'xs', width: 0, color: '#FED7AA' }, // under sm - orange
  { name: 'sm', width: 640, color: '#FECACA' }, // red
  { name: 'md', width: 768, color: '#FEF9C3' }, // yellow
  { name: 'lg', width: 1024, color: '#DCFCE7' }, // green
  { name: 'xl', width: 1280, color: '#BFDBFE' }, // blue
  { name: '2xl', width: 1536, color: '#F5D0FE' }, // purple
];

export interface ResponsiveTestGridProps {
  children: ReactNode;
  breakpoints?: Breakpoint[];
  showBreakpointIndicators?: boolean;
  showCurrentBreakpoint?: boolean;
  showGrid?: boolean;
  gridColumns?: number;
  className?: string;
}

/**
 * A component that helps visualize and test responsive layouts
 * by showing grid overlays and breakpoint indicators.
 */
export const ResponsiveTestGrid: React.FC<ResponsiveTestGridProps> = ({
  children,
  breakpoints = DEFAULT_BREAKPOINTS,
  showBreakpointIndicators = true,
  showCurrentBreakpoint = true,
  showGrid = true,
  gridColumns = 12,
  className,
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  
  // Update window width on resize
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determine current breakpoint
  const currentBreakpoint = [...breakpoints]
    .sort((a, b) => b.width - a.width)
    .find(bp => windowWidth >= bp.width) || breakpoints[0];
  
  // Sort breakpoints for display
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a.width - b.width);
  
  // Generate grid columns
  const gridItems = [];
  for (let i = 0; i < gridColumns; i++) {
    gridItems.push(
      <div 
        key={i} 
        className="h-full border-l border-dashed border-gray-400 border-opacity-30 first:border-l-0"
        style={{ flex: `1 0 ${100 / gridColumns}%` }}
      />
    );
  }
  
  return (
    <div className={cn('responsive-test-grid relative', className)}>
      {/* Breakpoint indicators at the top */}
      {showBreakpointIndicators && (
        <div className="breakpoint-indicators h-6 flex items-center sticky top-0 z-10 bg-white bg-opacity-90 text-sm text-center">
          {sortedBreakpoints.map((bp, index) => (
            <div 
              key={bp.name}
              className="h-full flex items-center justify-center"
              style={{ 
                width: index === sortedBreakpoints.length - 1 
                  ? `calc(100% - ${bp.width}px)` 
                  : `${sortedBreakpoints[index+1].width - bp.width}px`,
                backgroundColor: bp.color || 'transparent',
                marginLeft: index === 0 ? `${bp.width}px` : 0,
                display: bp.width > windowWidth ? 'none' : 'flex',
              }}
            >
              {bp.name}
            </div>
          ))}
        </div>
      )}
      
      {/* Current breakpoint indicator */}
      {showCurrentBreakpoint && (
        <div 
          className="current-breakpoint fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm font-medium z-50"
          style={{ 
            backgroundColor: currentBreakpoint.color || '#6B7280',
            color: isLightColor(currentBreakpoint.color || '#6B7280') ? '#000' : '#fff' 
          }}
        >
          {currentBreakpoint.name} ({windowWidth}px)
        </div>
      )}
      
      {/* Grid overlay */}
      {showGrid && (
        <div className="grid-overlay absolute inset-0 pointer-events-none z-10 flex">
          {gridItems}
        </div>
      )}
      
      {/* Content */}
      <div className="responsive-test-content relative z-0">
        {children}
      </div>
    </div>
  );
};

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate perceived brightness using the formula
  // (0.299*R + 0.587*G + 0.114*B)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  
  // Return whether the color is light or dark
  return brightness > 0.5;
}

export default ResponsiveTestGrid;