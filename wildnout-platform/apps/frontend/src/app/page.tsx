import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wild 'n Out Meme Coin - Official Platform',
  description: 'Join the Wild 'n Out meme coin community - Create, Battle, Win!',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-display text-battle-yellow mb-6">
              WILD 'N OUT
            </h1>
            <p className="text-xl md:text-2xl text-hype-white mb-8 max-w-3xl mx-auto">
              The official platform for the Wild 'n Out meme coin community.
              Create, battle, and build your legacy in the ultimate entertainment platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/sign-in" 
                className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-3 rounded-md text-lg"
              >
                Get Started
              </Link>
              <Link 
                href="/token" 
                className="bg-transparent hover:bg-hype-white/10 text-hype-white border border-hype-white font-medium px-8 py-3 rounded-md text-lg"
              >
                Token Info
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 px-4 bg-zinc-900">
          <div className="container mx-auto">
            <h2 className="text-3xl font-display text-hype-white text-center mb-12">
              What You Can Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-zinc-800 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-battle-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="text-xl font-display text-hype-white mb-3">
                  Battle
                </h3>
                <p className="text-zinc-300">
                  Compete in Wild 'n Out style battles, show off your skills, and win recognition.
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-battle-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-xl font-display text-hype-white mb-3">
                  Create
                </h3>
                <p className="text-zinc-300">
                  Make and share content, build your following, and showcase your creativity.
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-battle-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-display text-hype-white mb-3">
                  Earn
                </h3>
                <p className="text-zinc-300">
                  Hold $WILDNOUT tokens, unlock exclusive features, and grow with the platform.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Token Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-display text-hype-white mb-6">
                  $WILDNOUT Token
                </h2>
                <p className="text-zinc-300 mb-6">
                  The $WILDNOUT token powers our platform, giving holders exclusive benefits, enhanced features, and a stake in our growing community.
                </p>
                <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-400">Current Price</span>
                    <span className="text-hype-white font-medium">$0.00421</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-400">Market Cap</span>
                    <span className="text-hype-white font-medium">$9.2M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Next Milestone</span>
                    <span className="text-hype-white font-medium">$10M</span>
                  </div>
                </div>
                <Link 
                  href="/token" 
                  className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-6 py-2 rounded-md inline-block"
                >
                  Learn More
                </Link>
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-zinc-800 rounded-lg p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-display text-battle-yellow mb-2">
                      Token Chart Placeholder
                    </div>
                    <div className="text-zinc-400">
                      Price history visualization coming soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-battle-yellow/20 to-flow-blue/20">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-display text-hype-white mb-6">
              Ready to Join the Wild Side?
            </h2>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
              Get started today and become part of the Wild 'n Out community.
            </p>
            <Link 
              href="/sign-in" 
              className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-3 rounded-md text-lg"
            >
              Sign Up Now
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-zinc-900 py-8 px-4">
        <div className="container mx-auto">
          <div className="text-center text-zinc-400 text-sm">
            &copy; {new Date().getFullYear()} Wild 'n Out Meme Coin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
