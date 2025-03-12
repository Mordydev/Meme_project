import { SignUp } from '@clerk/nextjs';
 
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Join Success Kid</h1>
          <p className="mt-2 text-gray-600">Create your account and start earning rewards</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <SignUp redirectUrl="/(platform)/dashboard" />
        </div>
      </div>
    </div>
  );
}
