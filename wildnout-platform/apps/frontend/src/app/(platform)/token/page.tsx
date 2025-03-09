import { Metadata } from 'next'
import { TokenDashboard } from '@/components/token/token-dashboard'

export const metadata: Metadata = {
  title: 'Token Hub | Wild 'n Out',
  description: 'Track your $WILDNOUT tokens, view market performance, and access holder benefits',
}

export default function TokenPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TokenDashboard />
    </div>
  )
}
