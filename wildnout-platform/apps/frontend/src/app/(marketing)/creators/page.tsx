import { Metadata } from 'next'
import { FeatureSection } from '@/components/marketing/feature-section'
import { RegistrationCTA } from '@/components/marketing/registration-cta'

export const metadata: Metadata = {
  title: 'Creator Opportunities | Wild 'n Out Meme Coin',
  description: 'Discover creator opportunities on the Wild 'n Out Meme Coin platform. Build your audience, showcase your skills, and grow your influence.',
}

export default function CreatorsPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-900 to-wild-black">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display text-battle-yellow mb-6">
            Creator Opportunities
          </h1>
          <p className="text-xl text-hype-white mb-8 max-w-3xl mx-auto">
            The battles you love, the energy you crave, the community you belong to. Showcase your creativity and build your following on the Wild 'n Out platform.
          </p>
        </div>
      </section>
      
      {/* Creator Opportunity Section */}
      <FeatureSection
        title="Build Your Audience"
        description="The Wild 'n Out platform offers powerful opportunities to grow your audience and develop your unique creative voice."
        image=""
        orientation="left"
        features={[
          "Showcase your content to an engaged audience",
          "Get discovered through battle competitions",
          "Build a following based on your creative skills",
          "Connect with like-minded creators and fans",
          "Establish your unique creative identity"
        ]}
      />
      
      <FeatureSection
        title="Powerful Creation Tools"
        description="Express yourself with our intuitive yet powerful Creator Studio, designed to help you produce high-quality content across multiple formats."
        image=""
        orientation="right"
        features={[
          "Multi-format creation tools for text, image, and audio",
          "Built-in templates to jumpstart your creativity",
          "Draft management for works in progress",
          "Mobile-optimized creation experience",
          "Performance analytics to track your content"
        ]}
      />
      
      <FeatureSection
        title="Recognition & Growth"
        description="Get the recognition you deserve with our achievement and visibility systems designed to spotlight talented creators."
        image=""
        orientation="left"
        features={[
          "Achievement system to track your creative journey",
          "Featured spots for top creators and content",
          "Battle victories increase your visibility",
          "Creator spotlights on the platform homepage",
          "Build your reputation in the community"
        ]}
      />
      
      {/* Creator Types */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display text-hype-white mb-4">
              Creator Types
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Community first. Entertainment always. Innovation constantly. Our platform supports all types of creators:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="w-14 h-14 bg-battle-yellow/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3">
                Comedians & Performers
              </h3>
              <p className="text-zinc-300">
                Showcase your humor, improv skills, and performance talent through battle formats designed to highlight your unique voice.
              </p>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="w-14 h-14 bg-battle-yellow/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3">
                Writers & Wordsmiths
              </h3>
              <p className="text-zinc-300">
                Express yourself through freestyle writing, creative comebacks, and clever wordplay in text-based formats.
              </p>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="w-14 h-14 bg-battle-yellow/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3">
                Visual Artists & Meme Creators
              </h3>
              <p className="text-zinc-300">
                Share your visual creativity through memes, digital art, and image-based content that resonates with the community.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Success Stories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display text-hype-white mb-4">
              Creator Success Stories
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              See what creators are already accomplishing on our platform:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-full mr-4"></div>
                <div>
                  <h3 className="text-lg font-medium text-hype-white">ComedyKing92</h3>
                  <p className="text-zinc-400 text-sm">Joined 3 months ago</p>
                </div>
              </div>
              <p className="text-zinc-300 mb-4">
                "I've been creating comedy content for years but struggled to find the right audience. Since joining Wild 'n Out, I've won 5 battles, gained over 2,000 followers, and finally found a community that appreciates my style of humor."
              </p>
              <div className="flex gap-2">
                <span className="bg-battle-yellow/20 text-battle-yellow text-xs px-2 py-1 rounded-full">5 Battle Wins</span>
                <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-1 rounded-full">2,000+ Followers</span>
              </div>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-full mr-4"></div>
                <div>
                  <h3 className="text-lg font-medium text-hype-white">MemeQueen</h3>
                  <p className="text-zinc-400 text-sm">Joined 2 months ago</p>
                </div>
              </div>
              <p className="text-zinc-300 mb-4">
                "As a meme creator, I was always looking for the right platform to showcase my work. The Wild 'n Out community not only appreciates my content but the battle format has pushed me to improve and try new styles. My work is getting more recognition than ever!"
              </p>
              <div className="flex gap-2">
                <span className="bg-flow-blue/20 text-flow-blue text-xs px-2 py-1 rounded-full">Featured Creator</span>
                <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-1 rounded-full">1,500+ Followers</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <RegistrationCTA 
            title="Ready to Start Creating?" 
            subtitle="Community first. Entertainment always. Innovation constantly. Join now and start building your creative legacy!"
            buttonText="Become a Creator"
          />
        </div>
      </div>
    </div>
  )
}
