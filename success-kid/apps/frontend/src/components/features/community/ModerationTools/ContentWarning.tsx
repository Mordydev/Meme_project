'use client';

import React, { useState } from 'react';
import { WarningType } from '@/types';

interface ContentWarningProps {
  children: React.ReactNode;
  warningType: WarningType;
  onReveal?: () => void;
}

/**
 * Component to hide sensitive content behind a warning
 */
export function ContentWarning({ 
  children, 
  warningType,
  onReveal
}: ContentWarningProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Get the appropriate warning message and icon
  const getWarningInfo = () => {
    switch (warningType) {
      case 'sensitive':
        return {
          title: 'Sensitive Content',
          message: 'This content may contain material that some users might find sensitive or inappropriate.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )
        };
        
      case 'spoiler':
        return {
          title: 'Spoiler Warning',
          message: 'This content contains spoilers that might affect your enjoyment of certain media.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          )
        };
        
      case 'nsfw':
        return {
          title: 'Adult Content (NSFW)',
          message: 'This content is not suitable for work or public viewing and may contain adult themes.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )
        };
        
      default:
        return {
          title: 'Content Warning',
          message: 'This content may require your consideration before viewing.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )
        };
    }
  };
  
  const { title, message, icon } = getWarningInfo();
  
  // Handle revealing the content
  const handleReveal = () => {
    setIsRevealed(true);
    if (onReveal) onReveal();
  };
  
  if (isRevealed) {
    return <>{children}</>;
  }
  
  return (
    <div className="border rounded-md p-6 bg-muted/30">
      <div className="text-center space-y-4">
        <div className="text-alert flex justify-center">
          {icon}
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-1">{title}</h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        
        <div>
          <button 
            onClick={handleReveal}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md font-medium"
          >
            Show Content
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          By clicking "Show Content", you acknowledge that you're willingly viewing potentially sensitive material.
        </p>
      </div>
    </div>
  );
}

export default ContentWarning;
