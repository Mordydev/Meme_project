import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Content | Wild 'n Out',
  description: 'Create and share your content with the Wild 'n Out community',
}

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Creator Studio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg bg-zinc-800 p-6">
          <h3 className="text-xl font-display text-hype-white mb-4">Create New Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="w-full px-3 py-2 bg-zinc-700 rounded-md text-hype-white focus:outline-none focus:ring-2 focus:ring-battle-yellow"
                placeholder="Give your content a title"
              />
            </div>
            
            <div>
              <label className="block text-zinc-400 text-sm mb-2" htmlFor="content">
                Content
              </label>
              <textarea
                id="content"
                rows={5}
                className="w-full px-3 py-2 bg-zinc-700 rounded-md text-hype-white focus:outline-none focus:ring-2 focus:ring-battle-yellow"
                placeholder="Share your thoughts, bars, or story..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-zinc-400 text-sm mb-2">
                Media (Optional)
              </label>
              <div className="border-2 border-dashed border-zinc-700 rounded-md p-6 text-center">
                <div className="text-zinc-400 mb-2">
                  Drag and drop files here, or click to select files
                </div>
                <button className="bg-zinc-700 hover:bg-zinc-600 text-hype-white font-medium px-4 py-2 rounded-md">
                  Select Files
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-battle-yellow text-wild-black font-medium px-6 py-2 rounded-md">
                Publish
              </button>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg bg-zinc-800 p-6">
          <h3 className="text-xl font-display text-hype-white mb-4">Join Active Battles</h3>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-battle-yellow font-medium">
                    {["Wild Style Battle", "R&Beef Challenge", "Pick Up & Kill It"][i]}
                  </span>
                  <span className="text-xs bg-victory-green/20 text-victory-green px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <div className="text-zinc-200 text-sm mb-2">
                  {[
                    "Show your freestyle skills with celebrity impressions.",
                    "Create a short rap about your favorite Wild 'n Out moment.",
                    "Make up a funny joke using these three words: stage, mic, laugh."
                  ][i]}
                </div>
                <div className="text-xs text-zinc-400 mb-3">
                  Ends in {5 + i * 2} hours • {15 + i * 10} participants
                </div>
                <button className="bg-flow-blue text-hype-white text-sm font-medium px-3 py-1.5 rounded-md">
                  Enter Battle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="rounded-lg bg-zinc-800 p-6">
        <h3 className="text-xl font-display text-hype-white mb-4">Your Drafts</h3>
        
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border-b border-zinc-700 py-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-hype-white font-medium">
                  {["My freestyle ideas", "Battle submission draft"][i]}
                </h4>
                <div className="text-zinc-400 text-xs">
                  Last edited {["2 hours ago", "yesterday"][i]}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="bg-zinc-700 hover:bg-zinc-600 text-hype-white text-sm px-3 py-1.5 rounded-md">
                  Edit
                </button>
                <button className="bg-battle-yellow text-wild-black text-sm px-3 py-1.5 rounded-md">
                  Publish
                </button>
              </div>
            </div>
            <div className="mt-2 text-zinc-300 text-sm truncate">
              {[
                "I was thinking about doing a Kevin Hart impression where he...",
                "For the R&Beef challenge, I want to talk about how..."
              ][i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
