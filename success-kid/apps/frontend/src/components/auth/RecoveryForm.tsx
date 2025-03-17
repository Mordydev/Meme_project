'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

// Validation schema for email
const recoverySchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
});

type RecoveryFormValues = z.infer<typeof recoverySchema>;

interface RecoveryFormProps {
  type: 'password-reset' | 'account-recovery';
  onSuccess?: () => void;
}

/**
 * Authentication Recovery Form
 * 
 * Handles password reset and account recovery flows
 */
export function RecoveryForm({ type, onSuccess }: RecoveryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: RecoveryFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Different endpoints based on recovery type
      const endpoint = type === 'password-reset' 
        ? '/api/v1/auth/forgot-password'
        : '/api/v1/auth/account-recovery';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { email: values.email }
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.[0]?.message || 'An error occurred. Please try again.');
      }
      
      // Always show success even if email doesn't exist (for security)
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Recovery error:', error);
      
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTitle = () => {
    return type === 'password-reset' ? 'Reset Your Password' : 'Recover Your Account';
  };

  const getFormDescription = () => {
    return type === 'password-reset'
      ? 'Enter your email address and we'll send you a link to reset your password.'
      : 'Enter your email address and we'll help you recover access to your account.';
  };

  const getButtonText = () => {
    return type === 'password-reset' ? 'Send Reset Link' : 'Send Recovery Email';
  };

  // If the form has been successfully submitted, show success message
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Email Sent
          </CardTitle>
          <CardDescription>Check your inbox for next steps</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50">
            <AlertDescription>
              {type === 'password-reset'
                ? 'If an account exists with this email, you'll receive a password reset link shortly.'
                : 'If an account exists with this email, you'll receive recovery instructions shortly.'}
            </AlertDescription>
          </Alert>
          <p className="mt-4 text-sm text-muted-foreground">
            Don't see the email? Check your spam folder or try again in a few minutes.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/sign-in">Return to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{getFormTitle()}</CardTitle>
        <CardDescription>{getFormDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="name@example.com" 
                      type="email" 
                      autoComplete="email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the email address associated with your account.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                getButtonText()
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" asChild>
          <Link href="/sign-in" className="flex items-center text-sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
