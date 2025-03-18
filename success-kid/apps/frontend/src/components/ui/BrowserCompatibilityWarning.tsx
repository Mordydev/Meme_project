'use client';

import { useState, useEffect } from 'react';
import { 
  detectBrowser, 
  getFeatureSupportSummary 
} from '../../lib/browser-compatibility';

export function BrowserCompatibilityWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [browser, setBrowser] = useState<any>(null);
  const [featureSupport, setFeatureSupport] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if warning was previously dismissed
    const dismissedTime = localStorage.getItem('browser-warning-dismissed');
    
    if (dismissedTime) {
      const dismissedDate = new Date(dismissedTime);
      const now = new Date();
      
      // If dismissed more than 30 days ago, show again
      if (now.getTime() - dismissedDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('browser-warning-dismissed');
      } else {
        setDismissed(true);
      }
    }
    
    // Detect browser and feature support
    const browserInfo = detectBrowser();
    const supportInfo = getFeatureSupportSummary();
    
    setBrowser(browserInfo);
    setFeatureSupport(supportInfo);
    
    // Show warning if there are issues
    if (!dismissed && 
        (!browserInfo.supported || !supportInfo.criticalSupport || browserInfo.partialSupport)) {
      setShowWarning(true);
    }
  }, [dismissed]);

  if (!showWarning || !browser || !featureSupport) {
    return null;
  }

  const handleDismiss = () => {
    setShowWarning(false);
    localStorage.setItem('browser-warning-dismissed', new Date().toISOString());
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 bg-alert-50 border-t border-alert-200">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-alert" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-alert-800">
              {!browser.supported ? 
                "Your browser is not supported" : 
                "Limited browser support detected"}
            </h3>
            <div className="mt-2 text-sm text-alert-700">
              <p>
                {!browser.supported ? (
                  `${browser.name} ${browser.version} is not officially supported. Some features may not work correctly.`
                ) : browser.partialSupport ? (
                  `${browser.name} ${browser.version} has limited support. You may experience issues with some features.`
                ) : (
                  "Your browser is missing support for some features."
                )}
              </p>
              
              {featureSupport.missingCritical.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Missing critical features:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {featureSupport.missingCritical.map((feature: string) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {featureSupport.limitedFeatures.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Limited features:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {featureSupport.limitedFeatures.slice(0, 3).map((feature: string) => (
                      <li key={feature}>{feature}</li>
                    ))}
                    {featureSupport.limitedFeatures.length > 3 && (
                      <li>And {featureSupport.limitedFeatures.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              )}
              
              <p className="mt-2">
                For the best experience, we recommend using the latest version of 
                <a href="https://www.google.com/chrome/" className="text-primary ml-1 font-medium" target="_blank" rel="noopener noreferrer">
                  Chrome
                </a>,
                <a href="https://www.mozilla.org/firefox/" className="text-primary ml-1 font-medium" target="_blank" rel="noopener noreferrer">
                  Firefox
                </a>, or
                <a href="https://www.microsoft.com/edge" className="text-primary ml-1 font-medium" target="_blank" rel="noopener noreferrer">
                  Edge
                </a>.
              </p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="rounded-md inline-flex text-alert-400 hover:text-alert-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
