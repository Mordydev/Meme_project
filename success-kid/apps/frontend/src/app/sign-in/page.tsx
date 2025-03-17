import { SignInForm } from '@/components/auth/SignInForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Success Kid Platform',
  description: 'Sign in to your Success Kid account to access the community and earn rewards.'
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Success Kid</h1>
          <p className="mt-2 text-sm text-gray-600">The community platform for crypto enthusiasts</p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  );
}
