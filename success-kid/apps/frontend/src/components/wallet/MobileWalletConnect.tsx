'use client';

import React, { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2, Smartphone, Copy, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface MobileWalletConnectProps {
  walletType?: 'phantom' | 'solflare';
  sessionUrl?: string;
  deepLink?: string;
  qrData?: string;
  isGenerating?: boolean;
  error?: string | null;
  onOpenApp?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function MobileWalletConnect({
  walletType = 'phantom',
  sessionUrl = '',
  deepLink = '',
  qrData = '',
  isGenerating = false,
  error = null,
  onOpenApp,
  onRetry,
  className
}: MobileWalletConnectProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isCopied, setIsCopied] = useState(false);
  const [effectiveQrData, setEffectiveQrData] = useState(qrData || sessionUrl);
  const [activeTab, setActiveTab] = useState<string>(isMobile ? 'open' : 'scan');
  
  // Update QR data when props change
  useEffect(() => {
    setEffectiveQrData(qrData || sessionUrl);
  }, [qrData, sessionUrl]);
  
  // Update active tab when media query changes
  useEffect(() => {
    setActiveTab(isMobile ? 'open' : 'scan');
  }, [isMobile]);
  
  const handleCopyLink = () => {
    if (effectiveQrData) {
      navigator.clipboard.writeText(effectiveQrData);
      setIsCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  const getWalletAppName = () => {
    return walletType === 'phantom' ? 'Phantom' : 'Solflare';
  };
  
  const getWalletDownloadLink = () => {
    return walletType === 'phantom' 
      ? 'https://phantom.app/download' 
      : 'https://solflare.com/download';
  };
  
  const handleOpenApp = () => {
    if (onOpenApp) {
      onOpenApp();
      return;
    }
    
    // Default behavior - try to open the deep link
    if (deepLink) {
      window.location.href = deepLink;
    } else if (walletType === 'phantom') {
      // Universal link for Phantom
      if (effectiveQrData) {
        window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(effectiveQrData)}`;
      } else {
        window.location.href = 'https://phantom.app/ul/';
      }
    } else if (walletType === 'solflare') {
      // Universal link for Solflare
      if (effectiveQrData) {
        window.location.href = `https://solflare.com/ul/${encodeURIComponent(effectiveQrData)}`;
      } else {
        window.location.href = 'https://solflare.com/ul/';
      }
    }
  };
  
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <div 
            className="mr-2 h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <img 
              src={`/images/wallets/${walletType}.svg`} 
              alt={getWalletAppName()} 
              className="h-4 w-4"
            />
          </div>
          Connect {getWalletAppName()}
        </CardTitle>
        <CardDescription>
          {isMobile 
            ? `Connect using your ${getWalletAppName()} wallet app` 
            : `Scan the QR code with your ${getWalletAppName()} app`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {error}
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="mt-2"
                >
                  Try Again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
              <TabsTrigger value="open">Open App</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan" className="flex flex-col items-center">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-52 w-52">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-neutral-500">Generating connection...</p>
                </div>
              ) : effectiveQrData ? (
                <div className="mb-4">
                  <QRCode 
                    value={effectiveQrData}
                    size={200}
                    qrStyle="dots"
                    eyeRadius={5}
                    logoImage={walletType === 'phantom' ? '/images/wallets/phantom.svg' : '/images/wallets/solflare.svg'}
                    logoWidth={48}
                    logoHeight={48}
                    quietZone={10}
                  />
                  
                  <p className="text-xs text-center text-neutral-500 mt-2">
                    Open the {getWalletAppName()} app and scan this code
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-52 w-52">
                  <p className="text-sm text-neutral-500">No connection data available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="open" className="space-y-4">
              <Button 
                size="lg" 
                onClick={handleOpenApp}
                className="w-full"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Open {getWalletAppName()} App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-neutral-500 mb-2">Don't have {getWalletAppName()}?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getWalletDownloadLink(), '_blank')}
                >
                  Download {getWalletAppName()}
                </Button>
              </div>
              
              {effectiveQrData && (
                <div className="text-center border-t pt-4">
                  <p className="text-xs text-neutral-500 mb-2">
                    You can also copy the connection link:
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center text-center">
        <p className="text-xs text-neutral-500 max-w-xs">
          {activeTab === 'scan' 
            ? "Can't scan the QR code? Switch to 'Open App' to connect directly."
            : "Having trouble? Make sure you have the latest version of the app installed."}
        </p>
      </CardFooter>
    </Card>
  );
}
