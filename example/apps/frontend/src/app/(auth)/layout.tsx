export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg border border-zinc-800 bg-wild-black/50 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-4xl font-display text-battle-yellow">Wild 'n Out</h1>
          <p className="mt-2 text-hype-white/70">Join the wildest community on the blockchain</p>
        </div>
        
        {children}
      </div>
    </div>
  )
}
