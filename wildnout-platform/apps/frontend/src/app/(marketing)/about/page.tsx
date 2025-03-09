import { Metadata } from 'next'
import { RegistrationCTA } from '@/components/marketing/registration-cta'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About | Wild 'n Out Meme Coin',
  description: 'Learn about the Wild 'n Out Meme Coin platform, vision, and team',
}

export default function AboutPage() {
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display text-hype-white mb-4">
            About Wild 'n Out Meme Coin
          </h1>
          <p className="text-zinc-300 text-lg mb-8">
            The battles you love, the energy you crave, the community you belong to. $WILDNOUT - more than just a token.
          </p>
          
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-display text-battle-yellow mb-4">Our Vision</h2>
              <div className="prose prose-invert prose-zinc max-w-none">
                <p>
                  Wild 'n Out Meme Coin ($WILDNOUT) transforms the meme coin experience by combining Nick Cannon's Wild 'n Out entertainment legacy with innovative technology, creating a vibrant community where creativity, competition, and authentic engagement thrive.
                </p>
                <p>
                  Our platform creates an interactive digital ecosystem where fans, creators, and crypto enthusiasts can engage, compete, and earn in an authentic extension of the world's most successful comedy improv show, with Nick Cannon's direct involvement ensuring brand authenticity.
                </p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-display text-battle-yellow mb-4">The Problem We're Solving</h2>
              <div className="prose prose-invert prose-zinc max-w-none">
                <p>
                  Current celebrity-backed tokens often lack substance, resulting in short-lived hype cycles and eventual collapse. Most projects promise utility but deliver minimal value beyond speculation, eroding community trust through "rug pulls" and abandoned projects.
                </p>
                <p>
                  The Wild 'n Out Meme Coin ($WILDNOUT) addresses these challenges by:
                </p>
                <ul>
                  <li><strong>Authentic Celebrity Backing:</strong> Nick Cannon's direct involvement ensures genuine connection to the entertainment brand</li>
                  <li><strong>Real Utility:</strong> An interactive platform with tangible entertainment value</li>
                  <li><strong>Trust Building:</strong> Transparent operations and sustainable development roadmap</li>
                  <li><strong>Brand Synergy:</strong> True integration between the Wild 'n Out entertainment brand and cryptocurrency functionality</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-display text-battle-yellow mb-4">Platform Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                  <h3 className="text-xl font-semibold text-hype-white mb-2">Battle Arena</h3>
                  <p className="text-zinc-300">
                    Compete in Wild 'n Out style battles, showcase your creativity, and earn recognition through our competitive platforms.
                  </p>
                </div>
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                  <h3 className="text-xl font-semibold text-hype-white mb-2">Community Zone</h3>
                  <p className="text-zinc-300">
                    Connect with fellow fans and creators, share content, and build relationships in our thriving social environment.
                  </p>
                </div>
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                  <h3 className="text-xl font-semibold text-hype-white mb-2">Token Utility</h3>
                  <p className="text-zinc-300">
                    Access exclusive features, earn rewards, and participate in governance through our integrated token system.
                  </p>
                </div>
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                  <h3 className="text-xl font-semibold text-hype-white mb-2">Creator Studio</h3>
                  <p className="text-zinc-300">
                    Express yourself with our versatile content creation tools designed for multiple formats and creative styles.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-display text-battle-yellow mb-4">Roadmap & Milestones</h2>
              <div className="prose prose-invert prose-zinc max-w-none">
                <p>
                  Our platform development follows a clear progression tied to market cap milestones:
                </p>
                <ul>
                  <li><strong>$10M:</strong> Initial platform launch with core battle and community features</li>
                  <li><strong>$50M:</strong> Enhanced creator tools, expanded battle formats, and improved token utility</li>
                  <li><strong>$100M:</strong> Major marketing initiatives, celebrity partnerships, and platform expansion</li>
                  <li><strong>$200M:</strong> Advanced features, ecosystem development, and strategic partnerships</li>
                  <li><strong>$500M:</strong> Full platform vision realization with comprehensive ecosystem integration</li>
                </ul>
                <p>
                  Track our progress on the <Link href="/token" className="text-battle-yellow hover:underline">Token Hub</Link> and join our journey as we build the ultimate entertainment-meets-crypto platform.
                </p>
              </div>
            </section>
          </div>
          
          <div className="mt-16">
            <RegistrationCTA />
          </div>
        </div>
      </div>
    </div>
  )
}
