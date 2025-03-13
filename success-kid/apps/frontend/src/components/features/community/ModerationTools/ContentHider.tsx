'use client';

import React, { useState } from 'react';

interface ContentHiderProps {
  children: React.ReactNode;
  reason?: string;
  onShow?: () => void;
  onHide?: () => void;
  initiallyVisible?: boolean;
}

/**
 * Component to hide inappropriate content with toggle option
 */
export function ContentHider({ 
  children, 
  reason = 'This content has been hidden', 
  onShow,
  onHide,
  initiallyVisible = false
}: ContentHiderProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  
  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    
    if (newState && onShow) {
      onShow();
    } else if (!newState && onHide) {
      onHide();
    }
  };
  
  if (isVisible) {
    return (
      <div className="relative">
        {children}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={toggleVisibility}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Hide content
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border border-muted rounded-md p-4 bg-muted/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
          <span className="text-sm">{reason}</span>
        </div>
        
        <button
          type="button"
          onClick={toggleVisibility}
          className="text-xs text-primary hover:underline"
        >
          Show content
        </button>
      </div>
    </div>
  );
}

export default ContentHider;
