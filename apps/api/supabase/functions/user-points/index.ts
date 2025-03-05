// Follow Deno and Supabase Edge Function patterns
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PointsRequest {
  userId: string;
  action: 'post_created' | 'comment_created' | 'post_upvoted' | 'achievement_earned';
  referenceId?: string; // ID of the post, comment, or achievement
}

// Point values for different actions
const POINT_VALUES = {
  post_created: 10,
  comment_created: 5,
  post_upvoted: 2,
  achievement_earned: 0, // Points come from the achievement itself
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, action, referenceId } = await req.json() as PointsRequest
    
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Get points to award based on action
    let pointsToAward = POINT_VALUES[action]
    
    // If it's an achievement, get the points from the achievement record
    if (action === 'achievement_earned' && referenceId) {
      const { data: achievement, error: achievementError } = await supabaseClient
        .from('achievements')
        .select('points')
        .eq('id', referenceId)
        .single()
      
      if (achievementError) throw achievementError
      pointsToAward = achievement.points
    }
    
    // Record the points transaction
    const { data, error } = await supabaseClient
      .from('user_points')
      .insert({
        user_id: userId,
        points: pointsToAward,
        action_type: action,
        reference_id: referenceId
      })
      .select()
    
    if (error) throw error
    
    // Get updated total points for the user
    const { data: totalPoints, error: totalError } = await supabaseClient
      .rpc('get_user_total_points', { user_id_param: userId })
    
    if (totalError) throw totalError
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data, 
        totalPoints 
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