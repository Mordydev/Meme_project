import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community | Wild 'n Out',
  description: 'Connect with the Wild 'n Out community and share your content',
}

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Community</h1>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Content feed placeholders */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-zinc-800 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-700 mr-3"></div>
              <div>
                <div className="font-medium text-hype-white">
                  {["CreativeMC", "BattleKing", "FunnyGuy", "RhymeQueen"][i]}
                </div>
                <div className="text-xs text-zinc-400">
                  {["2 hours ago", "5 hours ago", "1 day ago", "3 days ago"][i]}
                </div>
              </div>
            </div>
            <div className="mb-4 text-zinc-200">
              {[
                "Check out my latest battle submission! Let me know what you think.",
                "Who's joining the freestyle battle tonight?",
                "That last battle was FIRE! So many great entries.",
                "Looking for feedback on my rhymes. Drop your thoughts below!"
              ][i]}
            </div>
            <div className="h-40 bg-zinc-700 rounded-md mb-4"></div>
            <div className="flex space-x-4 text-zinc-400">
              <button className="flex items-center hover:text-hype-white">
                <span className="mr-1">👍</span> {12 + i * 8}
              </button>
              <button className="flex items-center hover:text-hype-white">
                <span className="mr-1">💬</span> {5 + i * 3}
              </button>
              <button className="flex items-center hover:text-hype-white">
                <span className="mr-1">🔄</span> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
