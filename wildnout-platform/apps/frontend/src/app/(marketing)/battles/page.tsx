import { Metadata } from 'next'
import { BattleFormatCard } from '@/components/marketing/battle-format-card'
import { RegistrationCTA } from '@/components/marketing/registration-cta'
import { FeatureSection } from '@/components/marketing/feature-section'

export const metadata: Metadata = {
  title: 'Battle Arena | Wild 'n Out Meme Coin',
  description: 'Compete in Wild 'n Out style battles, show off your skills, and win recognition in our Battle Arena',
}

export default function BattlesPage() {
  // Battle format data
  const battleFormats = [
    {
      title: 'Wild Style',
      description: 'Showcase your freestyle creativity in our signature battle format based on the Wild 'n Out classic.',
      icon: '🔥',
      color: 'yellow',
      features: [
        'Express yourself in any content format',
        'Weekly themed challenges',
        'Community voting determines winners',
        'Top entries featured on platform',
        'Earn points and achievements'
      ]
    },
    {
      title: 'Pick Up & Kill It',
      description: 'Take a prompt and make it your own. Turn standard starting points into creative masterpieces.',
      icon: '✨',
      color: 'blue',
      features: [
        'Start with provided creative prompts',
        'Limited time to create your response',
        'Multiple media formats supported',
        'Head-to-head matchups',
        'Multi-round progression'
      ]
    },
    {
      title: 'R&Beef',
      description: 'Create the funniest, most creative roasts and comebacks in this comedy battle format.',
      icon: '🔥',
      color: 'red',
      features: [
        'Humorous comebacks and roasts',
        'Celebrity and pop culture themes',
        'Text and image submissions',
        'Series of rounds with escalating difficulty',
        'Special guest judge features'
      ]
    },
    {
      title: 'Tournament',
      description: 'Compete in multi-stage knockout competitions with higher stakes and bigger rewards.',
      icon: '🏆',
      color: 'green',
      features: [
        'Bracket-style elimination format',
        'Advance through multiple rounds',
        'Increasing challenge difficulty',
        'Extended voting periods',
        'Trophy and special reward systems'
      ]
    }
  ]
  
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-900 to-wild-black">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display text-battle-yellow mb-6">
            Battle Arena
          </h1>
          <p className="text-xl text-hype-white mb-8 max-w-3xl mx-auto">
            Built by the community for the community. Compete in Wild 'n Out style battles, showcase your creativity, and earn recognition in our digital arena.
          </p>
        </div>
      </section>
      
      {/* Battle Formats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-display text-hype-white mb-8 text-center">
            Battle Formats
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {battleFormats.map((format, index) => (
              <BattleFormatCard
                key={format.title}
                title={format.title}
                description={format.description}
                icon={format.icon}
                color={format.color}
                features={format.features}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <FeatureSection
        title="How Battles Work"
        description="Our battle system brings the competitive energy of Wild 'n Out to the digital world through a structured, engaging process that rewards creativity and skill."
        image=""
        features={[
          "Browse and join open battles in the Battle Arena",
          "Create your submission using our Creator Studio tools",
          "Submit before the deadline to enter the competition",
          "Vote on other entries during the voting phase",
          "Get results and rewards based on community voting"
        ]}
      />
      
      {/* Rewards Section */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display text-hype-white mb-4">
              Battle Rewards
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Competing in battles earns you more than just bragging rights. Here's what you can gain from participating:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="w-14 h-14 bg-battle-yellow/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏅</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3">
                Recognition & Status
              </h3>
              <p className="text-zinc-300">
                Build your reputation with wins and featured content. Earn achievements and status badges that showcase your skills to the community.
              </p>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="w-14 h-14 bg-battle-yellow/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3">
                Platform Points
              </h3>
              <p className="text-zinc-300">
                Earn points for participation, votes received, and victories. Points contribute to your level progression and unlock platform features.
              </p>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <div className="w-14 h-14 bg-battle-yellow/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3">
                Visibility & Discovery
              </h3>
              <p className="text-zinc-300">
                Winning entries get featured across the platform, helping you gain followers and build your audience through increased visibility.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Battles Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display text-hype-white mb-4">
              Featured Battles
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Here's a preview of the exciting battles waiting for you on the platform:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              <div className="bg-battle-yellow/10 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-battle-yellow font-medium text-sm uppercase">Wild Style</span>
                  <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-1 rounded-full">Weekly</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-hype-white text-xl font-semibold mb-2">Monday Night Freestyle</h3>
                <p className="text-zinc-400 text-sm mb-4">Show off your best freestyle skills in this weekly battle.</p>
                <div className="flex justify-between text-sm text-zinc-500 mb-4">
                  <span>30-45 participants</span>
                  <span>24 hour voting</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              <div className="bg-flow-blue/10 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-flow-blue font-medium text-sm uppercase">Pick Up & Kill It</span>
                  <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-1 rounded-full">Active</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-hype-white text-xl font-semibold mb-2">Meme Remix Challenge</h3>
                <p className="text-zinc-400 text-sm mb-4">Take a meme template and create something hilarious.</p>
                <div className="flex justify-between text-sm text-zinc-500 mb-4">
                  <span>40+ participants</span>
                  <span>3 day event</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              <div className="bg-roast-red/10 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-roast-red font-medium text-sm uppercase">R&Beef</span>
                  <span className="bg-zinc-600/40 text-zinc-300 text-xs px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-hype-white text-xl font-semibold mb-2">Celebrity Roast Battle</h3>
                <p className="text-zinc-400 text-sm mb-4">Create the funniest celebrity roasts in this special event.</p>
                <div className="flex justify-between text-sm text-zinc-500 mb-4">
                  <span>Limited slots</span>
                  <span>Celebrity judging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <RegistrationCTA 
            title="Ready to Enter the Battle?" 
            subtitle="Sign up now and show the world your skills in the Wild 'n Out Meme Coin Battle Arena."
            buttonText="Join the Battles"
          />
        </div>
      </div>
    </div>
  )
}
