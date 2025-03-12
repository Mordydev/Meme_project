import env from '@/env';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { auth } from '@clerk/nextjs';

export default function MarketingPage() {
  const { userId } = auth();
  const isSignedIn = !!userId;

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-r from-primary to-purple-600">
      <div className="max-w-5xl w-full mx-auto py-16 md:py-24">
        <div className="flex flex-col items-center text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Clench Your Fist, Claim Your Success!
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">
            Join the Success Kid community platform where crypto enthusiasts and meme lovers 
            connect, engage, and create value together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {isSignedIn ? (
              <Button asChild size="lg">
                <Link href="/(platform)/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/(auth)/register">Join Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/(auth)/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <section className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-8 mb-16">
        <h2 className="text-3xl font-bold mb-6 text-center">Market Cap Milestones</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">$100,000</span>
              <span className="text-accent font-medium">First milestone</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-accent h-2.5 rounded-full w-[45%]"></div>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">$500,000</span>
              <span className="text-gray-500 font-medium">Initial growth target</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-gray-400 h-2.5 rounded-full w-[10%]"></div>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">$1,000,000</span>
              <span className="text-gray-500 font-medium">Community establishment</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-gray-400 h-2.5 rounded-full w-[5%]"></div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Join the Community</h3>
            <p className="text-gray-600">Create an account and connect your wallet to become part of the Success Kid ecosystem.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Engage & Earn</h3>
            <p className="text-gray-600">Participate in discussions, create content, and earn Success Points (SP) for your contributions.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Redeem Rewards</h3>
            <p className="text-gray-600">Convert your Success Points to SKC tokens and enjoy the benefits of our growing ecosystem.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
