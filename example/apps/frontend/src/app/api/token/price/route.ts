import { NextResponse } from 'next/server'

/**
 * GET /api/token/price
 * Returns the current token price and 24h change percentage
 */
export async function GET() {
  try {
    // In a real implementation, you would fetch this from a price API or blockchain oracle
    // For now, we're returning mock data for development
    
    // Simulate API response latency
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Return mock price data
    return NextResponse.json({
      price: 0.00000456, // Price in USD
      change24h: 2.34, // 24h change percentage
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching token price:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 }
    )
  }
}
