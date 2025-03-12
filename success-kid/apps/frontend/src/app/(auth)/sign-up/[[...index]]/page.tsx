import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary">Sign Up</h1>
          <p className="mt-2 text-gray-600">Join the Success Kid Community!</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary-600 text-white',
              card: 'shadow-xl border border-gray-200',
            }
          }}
          routing="path"
          path="/sign-up"
        />
      </div>
    </div>
  );
}
