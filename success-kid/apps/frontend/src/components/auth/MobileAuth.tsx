'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { WalletAuth } from './WalletAuth';
import { Loader2, AlertCircle, Wallet, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface MobileAuthProps {
  mode?: 'sign-in' | 'sign-up';
  redirect?: string;
}

/**
 * Mobile-optimized Authentication Component
 * 
 * Provides a streamlined authentication experience on mobile devices
 * Offers multiple auth methods with an optimized UI for touch interaction
 */
export function MobileAuth({ mode = 'sign-in', redirect = '/dashboard' }: MobileAuthProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'wallet'>('email');
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Set component as mounted for client-side features
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && redirect) {
      router.push(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  // Detect if Phantom wallet is available in a mobile browser
  const [hasPhantomMobile, setHasPhantomMobile] = useState(false);
  
  useEffect(() => {
    // Check for Phantom mobile detection
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const hasPhantom = Boolean(window.phantom?.solana);
      
      setHasPhantomMobile(isMobile && hasPhantom);
    }
  }, []);

  // Early return if not mounted (for SSR)
  if (!isMounted) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">
          {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'email' | 'wallet')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              <span>{mode === 'sign-in' ? 'Email Sign In' : 'Email Sign Up'}</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Wallet</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4">
            {/* For mobile, we provide a link to the Clerk-hosted authentication pages */}
            <p className="text-center text-sm text-muted-foreground mb-4">
              {mode === 'sign-in'
                ? 'Sign in with your email to access your account'
                : 'Create a new account with your email address'}
            </p>
            
            <div className="space-y-4">
              <Button 
                asChild
                className="w-full"
                variant="outline"
              >
                <Link href={mode === 'sign-in' ? '/sign-in' : '/sign-up'}>
                  <Mail className="mr-2 h-4 w-4" />
                  {mode === 'sign-in' ? 'Continue with Email' : 'Sign Up with Email'}
                </Link>
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12" asChild>
                  <Link href={mode === 'sign-in' ? '/sign-in?provider=google' : '/sign-up?provider=google'}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="mr-2">
                      <path fill="currentColor" d="M12.545 12.151L12.542 12.161Q12.395 13.117 12.395 14.107Q12.395 15.097 12.542 16.054H12.545L12.545 16.188Q12.545 17.475 11.627 18.393Q10.71 19.312 9.423 19.312Q8.135 19.312 7.217 18.393Q6.3 17.475 6.3 16.188Q6.3 14.9 7.217 13.982Q8.135 13.064 9.423 13.064H12.545V12.151ZM21.7 12.151L21.7 12.161Q21.552 13.117 21.552 14.107Q21.552 15.097 21.7 16.054H21.7L21.7 16.188Q21.7 17.475 20.782 18.393Q19.865 19.312 18.577 19.312Q17.29 19.312 16.372 18.393Q15.455 17.475 15.455 16.188Q15.455 14.9 16.372 13.982Q17.29 13.064 18.577 13.064H21.7V12.151ZM12.545 6.619L12.542 6.629Q12.395 7.585 12.395 8.575Q12.395 9.565 12.542 10.522H12.545L12.545 10.656Q12.545 11.943 11.627 12.861Q10.71 13.779 9.423 13.779Q8.135 13.779 7.217 12.861Q6.3 11.943 6.3 10.656Q6.3 9.368 7.217 8.45Q8.135 7.532 9.423 7.532H12.545V6.619ZM21.7 6.619L21.7 6.629Q21.552 7.585 21.552 8.575Q21.552 9.565 21.7 10.522H21.7L21.7 10.656Q21.7 11.943 20.782 12.861Q19.865 13.779 18.577 13.779Q17.29 13.779 16.372 12.861Q15.455 11.943 15.455 10.656Q15.455 9.368 16.372 8.45Q17.29 7.532 18.577 7.532H21.7V6.619Z"/>
                    </svg>
                    Google
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-12" asChild>
                  <Link href={mode === 'sign-in' ? '/sign-in?provider=twitter' : '/sign-up?provider=twitter'}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="mr-2">
                      <path fill="currentColor" d="M18.205 2.25h3.308l-7.227 8.26l8.502 11.24H16.13l-5.214-6.817L4.95 21.75H1.64l7.73-8.835L1.215 2.25H8.04l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/>
                    </svg>
                    Twitter
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="wallet" className="space-y-4">
            {isMobile && !hasPhantomMobile ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wallet App Required</AlertTitle>
                  <AlertDescription>
                    To authenticate with your wallet on mobile, you&apos;ll need to install the Phantom app.
                  </AlertDescription>
                </Alert>
                
                <Button asChild className="w-full" variant="default">
                  <a 
                    href="https://phantom.app/download" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Download Phantom App
                  </a>
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  After installing, return here to continue
                </p>
              </div>
            ) : (
              <WalletAuth redirect={redirect} showTitle={false} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-center text-sm">
          {mode === 'sign-in' ? (
            <>
              Don&apos;t have an account?{' '}
              <Link 
                href="/sign-up" 
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link 
                href="/sign-in" 
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
