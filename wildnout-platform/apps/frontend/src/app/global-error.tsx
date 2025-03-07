'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="en">
      <body className="bg-wild-black text-hype-white">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-lg border border-roast-red bg-roast-red/10">
            <h1 className="text-3xl font-display text-roast-red mb-4">
              Something went wrong!
            </h1>
            <p className="text-zinc-200 mb-6">
              We're sorry, but there was a critical error. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
