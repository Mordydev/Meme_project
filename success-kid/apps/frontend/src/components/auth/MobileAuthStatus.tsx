'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserCircle, LogOut, Wallet, Award, Settings, Menu, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Mobile Authentication Status Component
 * 
 * Shows current auth status with optimized mobile UX
 * Provides quick access to profile, wallet, and logout
 */
export function MobileAuthStatus() {
  const { isAuthenticated, isLoading, profile, hasWalletConnected, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  // Close sheet when navigation occurs
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Handle sign out action
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Generate avatar fallback text from profile name
  const getAvatarFallback = () => {
    if (!profile?.displayName) return 'U';
    
    const nameParts = profile.displayName.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Show loading state while authentication state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  // If not authenticated, show sign in button
  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" className="h-8 px-3">
        <Link href="/sign-in">Sign In</Link>
      </Button>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          {profile?.avatar ? (
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatar} alt={profile.displayName || 'User'} />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className="h-6 w-6" />
          )}
          {hasWalletConnected && (
            <Badge 
              variant="secondary" 
              className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0"
            >
              <Wallet className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Account</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Profile summary */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar} alt={profile?.displayName || 'User'} />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-medium">{profile?.displayName || 'User'}</h3>
              <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {hasWalletConnected && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                Wallet Connected
              </Badge>
            )}
            
            {profile?.level && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Level {profile.level}
              </Badge>
            )}
          </div>
          
          {/* Quick actions */}
          <div className="space-y-1 py-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              asChild
            >
              <Link href="/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              asChild
            >
              <Link href="/wallet">
                <Wallet className="mr-2 h-4 w-4" />
                My Wallet
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              asChild
            >
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive" 
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
