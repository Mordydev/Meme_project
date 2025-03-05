import { supabase } from './supabase';

// Type definition for Clerk user
export interface ClerkUser {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
  primaryEmailAddressId?: string | null;
}

// Function to sync Clerk user with Supabase
export const syncUserWithSupabase = async (clerkUser: ClerkUser) => {
  try {
    if (!clerkUser) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Check if user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', clerkUser.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching user from Supabase:', fetchError);
      return null;
    }
    
    // If user doesn't exist, create a new user in Supabase
    if (!existingUser) {
      const primaryEmail = clerkUser.emailAddresses.find(email => 
        email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;
      
      if (!primaryEmail) {
        console.error('User has no primary email address');
        return null;
      }
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: clerkUser.id,
          username: clerkUser.username || `user_${clerkUser.id.substring(0, 8)}`,
          display_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
          avatar_url: clerkUser.imageUrl || null,
          email: primaryEmail,
          is_admin: false,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user in Supabase:', createError);
        return null;
      }
      
      return newUser;
    }
    
    // Update the existing user's last login time
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        // Optionally update other fields if they've changed in Clerk
        display_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || existingUser.display_name,
        avatar_url: clerkUser.imageUrl || existingUser.avatar_url
      })
      .eq('id', clerkUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user in Supabase:', updateError);
      return existingUser; // Return existing user data if update fails
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error syncing user with Supabase:', error);
    return null;
  }
};

// Function to check if user has admin role
export const isUserAdmin = async (userId: string) => {
  try {
    if (!userId) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.is_admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}; 