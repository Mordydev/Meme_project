import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Token Hub | Wild 'n Out',
  description: 'Track your $WILDNOUT tokens and view market performance',
}

export default function TokenPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Token Hub</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Token price card */}
        <div className="rounded-lg bg-zinc-800 p-6">
          <h3 className="text-sm uppercase text-zinc-400 mb-2">Current Price</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-display text-hype-white mr-2">$0.00421</span>
            <span className="text-victory-green text-sm">+5.2%</span>
          </div>
          <div className="h-40 bg-zinc-700 rounded-md mt-4 mb-2"></div>
          <div className="text-xs text-zinc-400">Last updated: 2 minutes ago</div>
        </div>
        
        {/* Market cap card */}
        <div className="rounded-lg bg-zinc-800 p-6">
          <h3 className="text-sm uppercase text-zinc-400 mb-2">Market Cap</h3>
          <div className="text-2xl font-display text-hype-white mb-4">$9.2M</div>
          
          <h4 className="text-sm text-zinc-400 mb-2">Milestone Progress</h4>
          <div className="relative h-8 bg-zinc-700 rounded-full overflow-hidden mb-4">
            <div className="absolute left-0 top-0 h-full w-[18%] bg-flow-blue"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              $9.2M / $50M
            </div>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>$10M</span>
            <span>$50M</span>
            <span>$100M</span>
            <span>$500M</span>
          </div>
        </div>
        
        {/* Connect wallet card */}
        <div className="rounded-lg bg-zinc-800 p-6">
          <h3 className="text-sm uppercase text-zinc-400 mb-2">Your Wallet</h3>
          <p className="text-zinc-200 mb-4">Connect your wallet to see your token balance and access holder benefits.</p>
          <button className="bg-battle-yellow text-wild-black font-medium px-4 py-2 rounded-md w-full">
            Connect Wallet
          </button>
        </div>
        
        {/* Holder benefits card */}
        <div className="rounded-lg bg-zinc-800 p-6">
          <h3 className="text-sm uppercase text-zinc-400 mb-2">Holder Benefits</h3>
          <ul className="space-y-2 text-zinc-200">
            <li className="flex items-center">
              <span className="mr-2 text-battle-yellow">●</span>
              Access exclusive battles
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-battle-yellow">●</span>
              Custom profile badge
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-battle-yellow">●</span>
              Enhanced voting power
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-battle-yellow">●</span>
              Creator spotlight eligibility
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
