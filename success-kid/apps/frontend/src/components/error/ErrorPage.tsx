import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error | null;
  reset: () => void;
  statusCode?: number;
  title?: string;
  description?: string;
}

/**
 * Default error messages based on status code
 */
const defaultErrorMessages: Record<number, { title: string; description: string }> = {
  400: {
    title: 'Bad Request',
    description: 'The request was invalid or cannot be served.',
  },
  401: {
    title: 'Unauthorized',
    description: 'You need to be logged in to view this page.',
  },
  403: {
    title: 'Forbidden',
    description: 'You don\'t have permission to access this page.',
  },
  404: {
    title: 'Page Not Found',
    description: 'The page you\'re looking for doesn\'t exist or has been moved.',
  },
  500: {
    title: 'Server Error',
    description: 'An unexpected error occurred. Please try again later.',
  },
  503: {
    title: 'Service Unavailable',
    description: 'The service is temporarily unavailable. Please try again later.',
  },
};

/**
 * A page-level error component for use with Next.js error.tsx files
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  reset,
  statusCode = 500,
  title,
  description,
}) => {
  const defaultMessage = defaultErrorMessages[statusCode] || defaultErrorMessages[500];
  
  const errorTitle = title || defaultMessage.title;
  const errorDescription = description || defaultMessage.description;
  
  // Log the error to help with debugging
  if (error && process.env.NODE_ENV !== 'production') {
    console.error('ErrorPage caught error:', error);
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          {/* Use appropriate illustration based on error */}
          {statusCode === 404 ? (
            <img 
              src="/images/illustrations/not-found.svg" 
              alt="Not Found" 
              className="w-48 h-48" 
            />
          ) : (
            <img 
              src="/images/illustrations/error.svg" 
              alt="Error" 
              className="w-48 h-48" 
            />
          )}
        </div>
        
        {/* Display the status code in a badge */}
        <div className="inline-block mb-4 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
          Error {statusCode}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {errorTitle}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {errorDescription}
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-center">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go to Homepage
          </Button>
          
          <Button onClick={reset}>
            Try Again
          </Button>
        </div>
        
        {/* Show error message in development */}
        {error && process.env.NODE_ENV !== 'production' && (
          <div className="mt-8 p-4 bg-gray-100 rounded overflow-auto text-sm">
            <p className="font-mono text-left">{error.toString()}</p>
            {error.stack && (
              <pre className="mt-2 text-xs text-left whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;