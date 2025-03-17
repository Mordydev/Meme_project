'use client';

import { useState, useEffect } from 'react';

type ColorMode = 'light' | 'dark';

export function useColorMode() {
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check for system preference and local storage
    const savedMode = localStorage.getItem('colorMode') as ColorMode | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode) {
      setColorMode(savedMode);
      document.documentElement.classList.toggle('dark', savedMode === 'dark');
    } else if (systemPrefersDark) {
      setColorMode('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleColorMode = () => {
    if (!isClient) return;
    
    setColorMode(prevMode => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', newMode);
      
      // Toggle dark class on html element
      document.documentElement.classList.toggle('dark', newMode === 'dark');
      
      return newMode;
    });
  };

  return { 
    colorMode,
    toggleColorMode,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light'
  };
}
