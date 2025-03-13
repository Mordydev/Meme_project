'use client';

import { WalletErrorType } from '@/store/useWalletStore';
import { Button } from '@/components/ui/button';
import { getRecoverySteps, getWalletErrorMessage } from '@/lib/wallet-utils';

interface WalletErrorRecoveryProps {
  errorType: WalletErrorType;
  onRetry: () => void;
  onCancel?: () => void;
  className?: string;
}

export function WalletErrorRecovery({
  errorType,
  onRetry,
  onCancel,
  className = ''
}: WalletErrorRecoveryProps) {
  const errorMessage = getWalletErrorMessage(errorType);
  const recoverySteps = getRecoverySteps(errorType);
  
  // For "not_installed" errors, provide a wallet installation link
  const renderInstallButton = () => {
    if (errorType === 'not_installed') {
      return (
        <Button
          variant="outline"
          onClick={() => window.open('https://phantom.app', '_blank')}
          className="mt-2"
        >
          Install Phantom Wallet
        </Button>
      );
    }
    return null;
  };
  
  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`}>
      <h3 className="font-semibold text-red-600 mb-2">Connection Error</h3>
      
      <p className="text-neutral-700 mb-4">
        {errorMessage}
      </p>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2 text-sm">Try these steps:</h4>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {recoverySteps.map((step, index) => (
            <li key={index} className="text-neutral-600">{step}</li>
          ))}
        </ol>
        
        {renderInstallButton()}
      </div>
      
      <div className="flex justify-end space-x-3 mt-4">
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
