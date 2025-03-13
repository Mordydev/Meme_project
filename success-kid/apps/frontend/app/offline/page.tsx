import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

/**
 * Offline Page
 * Displayed when a user is offline and tries to access a page that isn't cached
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400"
              >
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">You're offline</h1>
          
          <p className="text-neutral-600 mb-6">
            It looks like you're currently offline. Some features may be limited until you regain connection.
          </p>
          
          <div className="flex flex-col gap-2">
            <Link 
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              Go to Homepage
            </Link>
            
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex justify-center items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Card>
        
        <div className="mt-4 text-center text-neutral-500 text-sm">
          <p>Recently viewed pages may still be available while offline.</p>
        </div>
      </div>
    </div>
  );
}
