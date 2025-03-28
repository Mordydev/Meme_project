'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AppError, getErrorMessage } from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { ErrorCode } from '@success-kid/api-types';

interface ErrorMessageProps {
  error: unknown;
  title?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
  showDetails?: boolean;
}

/**
 * Error severity classification
 */
const errorSeverity: Record<string, 'destructive' | 'default'> = {
  [ErrorCode.VALIDATION_ERROR]: 'default',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'default',
  [ErrorCode.UNAUTHORIZED]: 'default',
  [ErrorCode.FORBIDDEN]: 'destructive',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'default',
  
  // Points-specific errors
  [ErrorCode.POINTS_LIMIT_EXCEEDED]: 'default',
  [ErrorCode.INSUFFICIENT_POINTS]: 'default',
  [ErrorCode.POINTS_TRANSFER_FAILED]: 'destructive',
  [ErrorCode.SUSPICIOUS_ACTIVITY]: 'destructive',
  [ErrorCode.REDEMPTION_FAILED]: 'destructive',
  
  // Wallet-specific errors
  [ErrorCode.WALLET_CONNECTION_ERROR]: 'default',
  [ErrorCode.WALLET_VERIFICATION_FAILED]: 'default',
  [ErrorCode.WALLET_ALREADY_CONNECTED]: 'default',
  [ErrorCode.BLOCKCHAIN_ERROR]: 'destructive',
  [ErrorCode.TRANSACTION_FAILED]: 'destructive',
};

/**
 * Icon mapping for different error types
 */
const errorIcons: Record<string, React.ReactNode> = {
  // Could be populated with different icons based on error type
};

/**
 * A component for displaying consistent error messages across the application
 */
export function ErrorMessage({
  error,
  title,
  showRetry = false,
  onRetry,
  className = '',
  variant,
  showDetails = false
}: ErrorMessageProps) {
  const message = getErrorMessage(error);
  const errorCode = error instanceof AppError ? error.code : 'UNKNOWN_ERROR';
  
  // Determine variant based on error code if not explicitly provided
  const computedVariant = variant || errorSeverity[errorCode] || 'default';
  
  // Determine title based on error type if not explicitly provided
  const computedTitle = title || (computedVariant === 'destructive' ? 'An error occurred' : 'Something went wrong');
  
  // Determine if we should show retry button
  const shouldShowRetry = showRetry && onRetry;
  
  // Extract error details for debugging in development
  const errorDetails = error instanceof AppError ? error.details : undefined;
  const isProd = process.env.NODE_ENV === 'production';
  
  return (
    <Alert variant={computedVariant} className={className}>
      <AlertTitle className="flex items-center">
        {errorIcons[errorCode] && <span className="mr-2">{errorIcons[errorCode]}</span>}
        {computedTitle}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2">{message}</div>
        
        {/* Show details in development or if explicitly requested */}
        {(showDetails || !isProd) && errorDetails && (
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(errorDetails, null, 2)}
          </pre>
        )}
        
        {shouldShowRetry && (
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ErrorMessage;