export default function PlatformLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-zinc-700 border-t-battle-yellow rounded-full animate-spin"></div>
        <p className="mt-6 text-xl font-display text-hype-white">Loading...</p>
      </div>
    </div>
  )
}
