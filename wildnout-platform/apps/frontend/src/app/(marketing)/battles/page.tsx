import { Metadata } from 'next'
import { BattleFormatCard } from '@/components/marketing/battle-format-card'
import { RegistrationCTA } from '@/components/marketing/registration-cta'
import { FeatureSection } from '@/components/marketing/feature-section'
import dynamic from 'next/dynamic'

// Dynamically import components with animations to improve initial load performance
const ParticleBackground = dynamic(
  () => import('@/components/marketing/particle-background'),
  { ssr: false }
)

const BattleChampions = dynamic(
  () => import('@/components/marketing/battle-champions'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: "Battle Arena | Wild 'n Out Meme Coin",
  description: "Compete in Wild 'n Out style battles, show off your skills, and win recognition in our Battle Arena",
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
      {/* Enhanced Hero Section with Dynamic Lighting */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Enhanced animated particle background */}
        <div className="absolute inset-0 -z-10">
          <ParticleBackground color="#E9E336" particleCount={400} particleSize={2.5} speed={0.03} />
        </div>
        
        {/* Advanced gradient overlay with multiple layers */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-wild-black/95 via-wild-black/85 to-wild-black"></div>
        
        {/* Dynamic lighting effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-2/3 h-96 bg-battle-yellow/20 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-40 right-0 w-72 h-72 bg-flow-blue/10 rounded-full blur-[80px] -z-10 opacity-70"></div>
        <div className="absolute top-40 left-0 w-60 h-60 bg-victory-green/10 rounded-full blur-[80px] -z-10 opacity-60"></div>
        
        <div className="container mx-auto text-center relative z-10">
          {/* Hero content with enhanced typography */}
          <div className="inline-block relative mb-3">
            <span className="bg-battle-yellow/20 text-battle-yellow px-4 py-1 rounded-full text-sm font-medium">
              THE ULTIMATE CREATIVE ARENA
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display text-hype-white mb-6 drop-shadow-glow relative overflow-hidden">
            <span className="text-battle-yellow relative z-10">Battle</span>
            <span className="relative z-10"> Arena</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-hype-white/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            Built by the community for the community. Compete in Wild 'n Out style battles, showcase your creativity, and earn recognition in our digital arena.
          </p>
          
          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/sign-up" 
              className="px-8 py-4 bg-battle-yellow text-wild-black font-medium rounded-lg hover:bg-battle-yellow/90 transition-all shadow-glow-sm hover:shadow-glow-md flex items-center justify-center group relative overflow-hidden"
            >
              {/* Animated shine effect */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-all duration-700 ease-in-out transform skew-x-[-20deg]"></span>
              
              {/* Glow effect */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-battle-yellow/40 blur-md"></span>
              
              <span className="mr-2 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.85"></path>
                  <path d="M16 3a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span className="group-hover:translate-x-1 transition-transform relative z-10">Enter Battle Arena</span>
            </a>
            
            <a 
              href="#battle-formats" 
              className="px-8 py-4 bg-transparent text-hype-white border border-hype-white/50 hover:border-battle-yellow hover:text-battle-yellow font-medium rounded-lg transition-all flex items-center justify-center group relative overflow-hidden"
            >
              {/* Subtle pulse effect on hover */}
              <span className="absolute inset-0 bg-battle-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              
              <span className="mr-2 relative z-10 group-hover:text-battle-yellow transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </span>
              <span className="group-hover:translate-x-1 transition-transform relative z-10">Learn About Battles</span>
            </a>
          </div>
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent"></div>
        
        {/* Animated microphone icon */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-battle-yellow/30 rounded-full blur-lg"></div>
            <div className="text-6xl">🎤</div>
          </div>
        </div>
      </section>
      
      {/* Battle Formats Section */}
      <section id="battle-formats" className="py-20 px-4 relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-wild-black via-wild-black/95 to-wild-black/90"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-grid-pattern opacity-10 -z-10"></div>
        
        {/* Glowing accent in corner */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-battle-yellow/10 rounded-full blur-[100px] -z-10"></div>
        
        <div className="container mx-auto relative">
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="bg-battle-yellow/10 rounded-full px-4 py-1 mb-2">
              <span className="text-battle-yellow text-sm font-medium">CHOOSE YOUR STYLE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display text-hype-white mb-4 text-center">
              Battle Formats
            </h2>
            <p className="text-zinc-400 max-w-2xl text-center">
              Four distinct battle formats inspired by the Wild 'n Out show, each with unique rules and challenges to test your creative skills.
            </p>
          </div>
          
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
      
      {/* Enhanced Rewards Section */}
      <section className="py-16 px-4 bg-zinc-900/50 relative overflow-hidden">
        {/* Background lighting effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-battle-yellow/5 rounded-full blur-[150px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-victory-green/5 rounded-full blur-[120px] -z-10 opacity-70"></div>
        
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
      
      {/* Champions Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Dynamic background lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-wild-black/80 via-wild-black to-wild-black/90 -z-10"></div>
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-battle-yellow/10 to-transparent -z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-flow-blue/10 to-transparent -z-10"></div>
        
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-battle-yellow/20 to-flow-blue/20 text-battle-yellow text-sm font-medium mb-4">
              BATTLE CHAMPIONS
            </div>
            <h2 className="text-4xl font-display text-hype-white mb-4 relative inline-block">
              Meet The <span className="text-battle-yellow">Champions</span>
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-battle-yellow to-flow-blue opacity-70"></span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              These creators dominate our battle arenas with creativity, wit, and star power
            </p>
          </div>
          
          {/* Champion Cards with enhanced visuals */}
          <BattleChampions />
        </div>
      </section>
      
      {/* Enhanced CTA Section */}
      <div className="py-16 px-4 relative overflow-hidden">
        {/* Dynamic background effects */}
        <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm -z-10"></div>
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-battle-yellow/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-flow-blue/10 rounded-full blur-[100px] -z-10"></div>
        
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
