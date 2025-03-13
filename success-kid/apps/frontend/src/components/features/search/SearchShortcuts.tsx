'use client';

import React from 'react';

export interface SearchShortcut {
  name: string;
  query: string;
  icon?: React.ReactNode;
}

export interface SearchShortcutsProps {
  shortcuts: SearchShortcut[];
  onSelect: (shortcut: SearchShortcut) => void;
  className?: string;
}

export function SearchShortcuts({
  shortcuts,
  onSelect,
  className = ''
}: SearchShortcutsProps) {
  if (!shortcuts || shortcuts.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {shortcuts.map((shortcut) => (
        <button
          key={shortcut.name}
          className="inline-flex items-center rounded-full border border-neutral-200 bg-background px-3 py-1 text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
          onClick={() => onSelect(shortcut)}
        >
          {shortcut.icon && <span className="mr-1">{shortcut.icon}</span>}
          {shortcut.name}
        </button>
      ))}
    </div>
  );
}

// Default search shortcuts
export const DEFAULT_SEARCH_SHORTCUTS: SearchShortcut[] = [
  {
    name: 'Posts',
    query: 'type:post',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    )
  },
  {
    name: 'Users',
    query: 'type:user',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  {
    name: 'Achievements',
    query: 'type:achievement',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    name: 'Trending',
    query: 'sort:trending',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  }
];
