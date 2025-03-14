'use client';

import React from 'react';
import { useViewport, Orientation } from './ViewportContext';

export interface OrientationHandlerProps {
  portrait: React.ReactNode;
  landscape: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
}

/**
 * A component that renders different content based on the device orientation
 * 
 * @param portrait - Content to render in portrait orientation
 * @param landscape - Content to render in landscape orientation
 * @param fallback - Content to render if orientation detection is unavailable
 * @param threshold - Aspect ratio threshold for determining orientation (default: 1)
 */
export function OrientationHandler({
  portrait,
  landscape,
  fallback,
  threshold = 1,
}: OrientationHandlerProps) {
  const { width, height, orientation } = useViewport();
  
  // On the server or if viewport dimensions are not available, render fallback
  if (width === 0 || height === 0) {
    return <>{fallback || portrait}</>;
  }
  
  // Calculate aspect ratio and determine orientation if custom threshold is provided
  const aspectRatio = width / height;
  const calculatedOrientation: Orientation = aspectRatio >= threshold ? 'landscape' : 'portrait';
  
  // Use calculated orientation or the one from context
  const finalOrientation = threshold !== 1 ? calculatedOrientation : orientation;
  
  return <>{finalOrientation === 'portrait' ? portrait : landscape}</>;
}

export interface ShowInOrientationProps {
  orientation: Orientation | 'both';
  children: React.ReactNode;
  threshold?: number;
}

/**
 * A component that only renders its children in the specified orientation
 * 
 * @param orientation - The orientation to show the children in ('portrait', 'landscape', or 'both')
 * @param children - The content to render
 * @param threshold - Aspect ratio threshold for determining orientation (default: 1)
 */
export function ShowInOrientation({
  orientation,
  children,
  threshold = 1,
}: ShowInOrientationProps) {
  const { width, height } = useViewport();
  
  // On the server or if viewport dimensions are not available, render fallback
  if (width === 0 || height === 0) {
    return <>{children}</>;
  }
  
  // Calculate aspect ratio and determine orientation
  const aspectRatio = width / height;
  const currentOrientation: Orientation = aspectRatio >= threshold ? 'landscape' : 'portrait';
  
  // Show in all orientations or only in the specified one
  if (orientation === 'both' || orientation === currentOrientation) {
    return <>{children}</>;
  }
  
  return null;
}
