import { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Profile | Wild 'n Out',
  description: 'View and manage your Wild 'n Out profile and achievements',
}

export default async function ProfilePage() {
  const user = await currentUser()
  
  if (!user) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile sidebar */}
        <div className="w-full md:w-1/3">
          <div className="rounded-lg bg-zinc-800 p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-zinc-700 mb-4">
                {user.imageUrl && (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                )}
              </div>
              <h2 className="text-xl font-display text-hype-white">
                {user.firstName} {user.lastName}
              </h2>
              <div className="text-zinc-400">@{user.username || 'username'}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div>
                <div className="text-xl font-medium text-hype-white">12</div>
                <div className="text-xs text-zinc-400">Battles</div>
              </div>
              <div>
                <div className="text-xl font-medium text-hype-white">3</div>
                <div className="text-xs text-zinc-400">Wins</div>
              </div>
              <div>
                <div className="text-xl font-medium text-hype-white">156</div>
                <div className="text-xs text-zinc-400">Followers</div>
              </div>
            </div>
            
            <div className="space-y-1 mb-6">
              <div className="text-sm text-zinc-400">About</div>
              <div className="text-zinc-200">
                {user.bio || 'No bio yet. Add one to tell the community about yourself!'}
              </div>
            </div>
            
            <button className="bg-zinc-700 hover:bg-zinc-600 text-hype-white font-medium px-4 py-2 rounded-md w-full">
              Edit Profile
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="w-full md:w-2/3">
          {/* Achievements section */}
          <div className="mb-8">
            <h3 className="text-2xl font-display text-hype-white mb-4">Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-4 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-700 mb-2"></div>
                  <div className="text-center">
                    <div className="font-medium text-hype-white">
                      {[
                        "First Battle",
                        "Battle Winner",
                        "Content Creator",
                        "Community Star",
                        "Token Holder",
                        "Freestyle King"
                      ][i]}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {["Earned 2 weeks ago", "Earned 1 month ago", "Earned 2 months ago", 
                        "Locked", "Locked", "Locked"][i]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Content section */}
          <div>
            <h3 className="text-2xl font-display text-hype-white mb-4">Your Content</h3>
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                      {["Battle Entry", "Community Post", "Battle Winner"][i]}
                    </div>
                    <div className="text-xs text-zinc-400 ml-2">
                      {["2 weeks ago", "1 month ago", "2 months ago"][i]}
                    </div>
                  </div>
                  <div className="h-32 bg-zinc-700 rounded-md mb-2"></div>
                  <div className="text-zinc-200">
                    {[
                      "My submission for the Monday Madness battle. Got some great feedback!",
                      "Sharing my thoughts on the latest token milestone. We're making progress!",
                      "My winning entry for the Freestyle King battle. Thanks for all the votes!"
                    ][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
