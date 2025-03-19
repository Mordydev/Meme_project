'use client';

import { ReactNode, useEffect, useState } from 'react';

interface AnimateOnMountProps {
  children: ReactNode;
  initial?: boolean;
}

/**
 * AnimateOnMount - Renders its children only after component has mounted on the client
 * This prevents hydration mismatches for animations and dynamic content
 */
export function AnimateOnMount({ children, initial = false }: AnimateOnMountProps) {
  const [isMounted, setIsMounted] = useState(initial);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Return null during server-side rendering or initial client mount
  if (!isMounted) {
    return null;
  }
  
  return <>{children}</>;
}
