import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto bg-zinc-800 rounded-lg p-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-700 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-display text-hype-white mb-4">User Not Found</h1>
        
        <p className="text-zinc-300 mb-6">
          This user profile doesn't exist or may have been removed.
        </p>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Link href="/profile">
            <Button>
              Go to Your Profile
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="secondary">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
