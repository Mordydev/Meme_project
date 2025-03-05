import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ClerkUser, syncUserWithSupabase } from '@/lib/clerk';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400
    });
  }

  // Handle the webhook event
  const eventType = evt.type;
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, username, first_name, last_name, image_url, email_addresses, primary_email_address_id } = evt.data;
    
    // Convert Clerk user data to our ClerkUser interface
    const clerkUser: ClerkUser = {
      id,
      username: username || null,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
      emailAddresses: email_addresses.map((email: any) => ({
        id: email.id,
        emailAddress: email.email_address
      })),
      primaryEmailAddressId: primary_email_address_id || null
    };
    
    // Sync the user with Supabase
    await syncUserWithSupabase(clerkUser);
  }
  
  if (eventType === 'user.deleted') {
    const userId = evt.data.id;
    
    // Delete the user from Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting user from Supabase:', error);
    }
  }

  return NextResponse.json({ success: true });
} 