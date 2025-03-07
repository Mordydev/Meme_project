import * as web3 from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

/**
 * Connection to Solana network.
 * Uses the environment variable or falls back to devnet.
 */
export const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
)

/**
 * WILDNOUT token mint address
 */
export const WILDNOUT_TOKEN_MINT = new web3.PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Placeholder address
)

/**
 * Minimum WILDNOUT balance for holder benefits (1000 tokens)
 */
export const MIN_HOLDER_BALANCE = 1000

/**
 * Get token balance for a wallet
 * @param walletAddress - The public key of the wallet
 * @returns Promise<number> The token balance
 */
export async function getTokenBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new web3.PublicKey(walletAddress)
    
    // Find token account
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    )
    
    // Find the account for our token
    const tokenAccount = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === WILDNOUT_TOKEN_MINT.toString()
    )
    
    if (!tokenAccount) {
      return 0
    }
    
    // Return the balance
    const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount
    return balance || 0
  } catch (error) {
    console.error('Error getting token balance:', error)
    return 0
  }
}

/**
 * Get token price from external API
 * @returns Promise<{ price: number, change24h: number }> Current price and 24h change
 */
export async function getTokenPrice(): Promise<{ price: number, change24h: number }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/token/price`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token price: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      price: data.price || 0,
      change24h: data.change24h || 0
    }
  } catch (error) {
    console.error('Error fetching token price:', error)
    return { price: 0, change24h: 0 }
  }
}

/**
 * Get token market cap from external API
 * @returns Promise<{ marketCap: number, fullyDiluted: number }> Current market cap
 */
export async function getTokenMarketCap(): Promise<{ marketCap: number, fullyDiluted: number }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/token/market-cap`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token market cap: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      marketCap: data.marketCap || 0,
      fullyDiluted: data.fullyDiluted || 0
    }
  } catch (error) {
    console.error('Error fetching token market cap:', error)
    return { marketCap: 0, fullyDiluted: 0 }
  }
}

/**
 * Get token transaction history for a wallet
 * @param walletAddress - The public key of the wallet
 * @returns Promise<Array> The transaction history
 */
export async function getTokenTransactions(walletAddress: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/token/transactions?wallet=${walletAddress}`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token transactions: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.transactions || []
  } catch (error) {
    console.error('Error fetching token transactions:', error)
    return []
  }
}

/**
 * Get market milestones for the token
 * @returns Promise<Array> The milestone data
 */
export async function getTokenMilestones(): Promise<any[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/token/milestones`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token milestones: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.milestones || []
  } catch (error) {
    console.error('Error fetching token milestones:', error)
    return []
  }
}

/**
 * Verify a user has the minimum required token balance for holder benefits
 * @param walletAddress - The public key of the wallet
 * @returns Promise<boolean> Whether the user is a qualified holder
 */
export async function isQualifiedHolder(walletAddress: string): Promise<boolean> {
  try {
    const balance = await getTokenBalance(walletAddress)
    return balance >= MIN_HOLDER_BALANCE
  } catch (error) {
    console.error('Error verifying holder status:', error)
    return false
  }
}

/**
 * Determine holder tier based on token balance
 * @param balance - Token balance
 * @returns string The holder tier
 */
export function getHolderTier(balance: number): 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (balance < MIN_HOLDER_BALANCE) return 'none'
  if (balance < 10000) return 'bronze'
  if (balance < 50000) return 'silver'
  if (balance < 250000) return 'gold'
  return 'platinum'
}
