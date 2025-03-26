'use client';

import React, { ReactNode } from 'react';
import { useViewport } from '@/hooks/useViewport';

export interface OrientationHandlerProps {
  children: ReactNode;
  portrait?: ReactNode;
  landscape?: ReactNode;
}

/**
 * Component that renders different content based on the device orientation.
 * 
 * Use this to optimize the UI for different orientations on mobile devices.
 */
export const OrientationHandler: React.FC<OrientationHandlerProps> = ({
  children,
  portrait,
  landscape,
}) => {
  const { orientation } = useViewport();
  
  // If specific content is provided for the current orientation, use it
  if (orientation === 'portrait' && portrait) {
    return <>{portrait}</>;
  }
  
  if (orientation === 'landscape' && landscape) {
    return <>{landscape}</>;
  }
  
  // Otherwise, return default children
  return <>{children}</>;
};

export default OrientationHandler;