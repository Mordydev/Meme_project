// Follow Deno and Supabase Edge Function patterns
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock token data - in production, this would come from a real API
interface TokenData {
  price: number;
  volume_24h: number;
  market_cap: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  last_updated: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // In a real implementation, fetch data from CoinGecko, CoinMarketCap, or another API
    // For now, we'll use mock data
    const tokenData: TokenData = await fetchTokenMarketData()
    
    // Store the market snapshot in the database
    const { data, error } = await supabaseClient
      .from('market_snapshots')
      .insert({
        price: tokenData.price,
        volume_24h: tokenData.volume_24h,
        market_cap: tokenData.market_cap,
        price_change_24h: tokenData.price_change_24h,
        price_change_percentage_24h: tokenData.price_change_percentage_24h,
        circulating_supply: tokenData.circulating_supply,
        total_supply: tokenData.total_supply
      })
      .select()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: tokenData,
        snapshot: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// Mock function to fetch token market data
// In production, this would call a real API
async function fetchTokenMarketData(): Promise<TokenData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate some random data for demonstration
  const basePrice = 0.00001234
  const priceChange = basePrice * (Math.random() * 0.1 - 0.05) // -5% to +5%
  
  return {
    price: basePrice + priceChange,
    volume_24h: Math.random() * 1000000,
    market_cap: Math.random() * 10000000,
    price_change_24h: priceChange,
    price_change_percentage_24h: (priceChange / basePrice) * 100,
    circulating_supply: 100000000000,
    total_supply: 1000000000000,
    last_updated: new Date().toISOString()
  }
} 