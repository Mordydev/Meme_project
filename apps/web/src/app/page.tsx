import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="flex flex-col items-center text-center py-12 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to the Success Kid Community
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8">
          Join the community of Success Kid token holders and enthusiasts. Connect, share, and grow together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Join the Community</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-4">
            Link your wallet to verify your Success Kid token holdings and unlock exclusive features.
          </p>
          <Button asChild variant="outline">
            <Link href="/profile">Connect Wallet</Link>
          </Button>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Join the Forum</h2>
          <p className="text-muted-foreground mb-4">
            Participate in discussions, share ideas, and connect with other community members.
          </p>
          <Button asChild variant="outline">
            <Link href="/forum">Browse Forum</Link>
          </Button>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Track the Market</h2>
          <p className="text-muted-foreground mb-4">
            Stay updated with the latest Success Kid token price, market cap, and trading volume.
          </p>
          <Button asChild variant="outline">
            <Link href="/market">View Market</Link>
          </Button>
        </div>
      </section>
    </div>
  );
} 