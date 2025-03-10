import { NextResponse } from 'next/server'

/**
 * GET /api/token/transactions
 * Returns token transactions for a specific wallet
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // In a real implementation, you would fetch this from the blockchain
    // For now, we're returning mock data for development
    
    // Simulate API response latency
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Create some mock transactions based on the wallet address
    // (Using the wallet address ensures consistent results for the same wallet)
    const mockTransactions = generateMockTransactions(walletAddress)
    
    return NextResponse.json({
      transactions: mockTransactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction data' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock transactions for a wallet
 * @param walletAddress Wallet address to generate transactions for
 * @returns Array of mock transactions
 */
function generateMockTransactions(walletAddress: string) {
  // Use the wallet address to generate consistent transactions
  const addressSum = walletAddress.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const transactionCount = (addressSum % 5) + 3 // Generate 3-7 transactions
  
  const transactions = []
  const now = Date.now()
  
  for (let i = 0; i < transactionCount; i++) {
    // Generate semi-random values based on wallet address and index
    const seed = addressSum + i
    const timeOffset = seed % 10 * 24 * 60 * 60 * 1000 // 0-10 days ago
    const amount = Math.floor((seed % 100) * 1000 + 1000) // 1000-100000 tokens
    const isReceive = seed % 2 === 0
    
    // Generate random addresses
    const otherParty = `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 10)}`
    
    transactions.push({
      id: `tx-${walletAddress.substring(0, 6)}-${i}`,
      type: isReceive ? 'receive' : 'send',
      amount,
      timestamp: new Date(now - timeOffset).toISOString(),
      sender: isReceive ? otherParty : walletAddress,
      recipient: isReceive ? walletAddress : otherParty,
      confirmed: timeOffset > 1 * 60 * 60 * 1000 // Pending if less than 1 hour ago
    })
  }
  
  // Sort by timestamp (newest first)
  return transactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}
