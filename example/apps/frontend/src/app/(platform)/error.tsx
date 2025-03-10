'use client'

import { useEffect } from 'react'

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-roast-red/10 border border-roast-red p-6 rounded-lg mb-6 max-w-lg w-full">
          <h2 className="text-2xl font-display text-roast-red mb-4">Something went wrong!</h2>
          <p className="text-zinc-200 mb-6">
            We're sorry, but there was an error loading this page. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="bg-battle-yellow text-wild-black font-medium px-4 py-2 rounded-md"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
