// Follow Deno and Supabase Edge Function patterns
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, message, signature } = await req.json()
    
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Verify the signature using appropriate crypto libraries
    // This is a simplified implementation
    const isValid = await verifySignature(address, message, signature)
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Update the wallet connection as verified
    const { data, error } = await supabaseClient
      .from('wallet_connections')
      .update({ verified: true, last_verified: new Date().toISOString() })
      .eq('address', address)
      .select()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// Simplified signature verification function - would use actual crypto in production
async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
  // In a real implementation, we would use ethers.js or a similar library to verify the signature
  console.log(`Verifying signature for address ${address} with message "${message}" and signature ${signature}`)
  
  // For development purposes, we'll just return true
  // In production, implement proper signature verification
  return true
} 