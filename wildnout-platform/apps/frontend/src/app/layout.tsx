import { Providers } from '@/components/providers'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wild 'n Out Meme Coin',
  description: 'The official platform for the Wild 'n Out meme coin community',
  applicationName: 'Wild 'n Out',
  appleWebApp: {
    capable: true,
    title: 'Wild 'n Out',
    statusBarStyle: 'black-translucent',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#121212',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-wild-black text-hype-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
