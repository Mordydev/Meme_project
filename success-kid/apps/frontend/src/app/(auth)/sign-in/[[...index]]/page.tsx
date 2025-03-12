import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary">Sign In</h1>
          <p className="mt-2 text-gray-600">Welcome back to the Success Kid Platform!</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary-600 text-white',
              card: 'shadow-xl border border-gray-200',
            }
          }}
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
}
