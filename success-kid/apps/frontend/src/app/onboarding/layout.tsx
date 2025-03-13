import { SignedIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  
  // If not authenticated, redirect to sign-in
  if (!userId) {
    redirect('/sign-in');
  }
  
  return (
    <SignedIn>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
        <div className="container mx-auto max-w-4xl py-8">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary">Welcome to Success Kid!</h1>
            <p className="mt-2 text-gray-600">Let's set up your profile and get you started</p>
          </header>
          
          <main className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
            {children}
          </main>
          
          <footer className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Success Kid Community Platform
          </footer>
        </div>
      </div>
    </SignedIn>
  );
}
