import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

// This endpoint handles Clerk webhooks
export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Clerk webhook secret is missing');
    return new Response('Webhook secret missing', { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with the webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook payload
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  // Handle different webhook types
  const eventType = evt.type;

  switch (eventType) {
    case 'user.created':
      // A new user has been created
      console.log('User created:', evt.data.id);
      // Here you can set up default data or trigger welcome emails
      break;
    case 'user.updated':
      // An existing user has been updated
      console.log('User updated:', evt.data.id);
      break;
    case 'session.created':
      // A new session has been created
      console.log('Session created:', evt.data.id);
      break;
    case 'session.ended':
      // A session has ended
      console.log('Session ended:', evt.data.id);
      break;
    default:
      // Unknown event type
      console.log('Unknown webhook event type:', eventType);
      break;
  }

  // Return a 200 response to acknowledge receipt of the webhook
  return new Response('Webhook received', { status: 200 });
}
