'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OAuthButton } from '@/components/auth/providers/OAuthButton';
import { WalletAuthButton } from '@/components/wallet/WalletAuthButton';

export function SignUpForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();

  // Handle email/password sign up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignUpLoaded) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });
      
      // Check if email verification is required
      if (result.status === 'complete') {
        // Sign up is complete, redirect to onboarding
        router.push('/onboarding');
      } else if (result.status === 'needs_verification') {
        // Email verification is required
        await signUp.prepareVerification({
          strategy: 'email_code',
          emailAddress: email,
        });
        setPendingVerification(true);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignUpLoaded) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signUp.attemptVerification({
        strategy: 'email_code',
        code,
      });
      
      if (result.status === 'complete') {
        // Verification complete, redirect to onboarding
        router.push('/onboarding');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-gray-600">Join the Success Kid community</p>
      </div>
      
      {!pendingVerification ? (
        /* Sign Up Form */
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading || !isSignUpLoaded}
              className="w-full"
            >
              Create Account
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>
          
          {/* Social Sign-Up Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <OAuthButton
              provider="google"
              label="Sign up with Google"
              icon={<GoogleIcon />}
              mode="sign-up"
            />
            
            <OAuthButton
              provider="twitter"
              label="Sign up with Twitter"
              icon={<TwitterIcon />}
              mode="sign-up"
            />
            
            <OAuthButton
              provider="discord"
              label="Sign up with Discord"
              icon={<DiscordIcon />}
              mode="sign-up"
            />
            
            {/* Wallet Authentication */}
            <div className="pt-2">
              <WalletAuthButton />
            </div>
          </div>
        </>
      ) : (
        /* Verification Form */
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              required
              className="w-full"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading || !isSignUpLoaded}
            className="w-full"
          >
            Verify Email
          </Button>
          
          <p className="text-sm text-center text-gray-600">
            Check your email for a verification code.
          </p>
        </form>
      )}
      
      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account?</span>{' '}
        <a href="/sign-in" className="text-primary hover:underline font-medium">
          Sign in
        </a>
      </div>
    </div>
  );
}

// Simple icon components for providers
function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm-.05 4c2.791 0 5.227 1.528 6.505 3.792l-3.795 2.196c-.467-1.254-1.698-2.152-3.16-2.152-1.751 0-3.17 1.42-3.17 3.164 0 1.747 1.42 3.164 3.17 3.164 1.463 0 2.693-.897 3.16-2.152l3.795 2.198C16.785 18.34 14.33 20 11.95 20 7.738 20 4.332 16.606 4.332 12c0-4.606 3.406-8 7.618-8z"
      />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="currentColor"
        d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" width="20" height="20">
      <path
        fill="currentColor"
        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
      />
    </svg>
  );
}
