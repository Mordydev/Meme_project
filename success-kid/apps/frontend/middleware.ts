import { authMiddleware, redirectToSignIn } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Helper function to check if a route is public
// Adjust this list based on your actual public pages
const publicRoutes = [
  '/',
  '/about',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
  '/sign-in(.*)', // Matches /sign-in and /sign-in/*
  '/sign-up(.*)', // Matches /sign-up and /sign-up/*
  '/api/webhook/clerk', // Clerk webhook endpoint
  // Add any other public API routes or pages here
];

// Helper function to check if a route should be ignored by the middleware
// Typically includes static assets, Next.js internals, and specific webhooks
const ignoredRoutes = [
  '/api/webhook/(.*)', // Ignore all webhooks except Clerk's (already public)
  '/_next/(.*)',       // Next.js internal assets
  '/favicon.ico',
  '/site.webmanifest',
  '/images/(.*)',      // Example: Ignore static image assets
  '/fonts/(.*)',       // Example: Ignore static font assets
];

export default authMiddleware({
  // Define public routes accessible without authentication
  publicRoutes: publicRoutes,

  // Define routes to be ignored by the middleware
  ignoredRoutes: ignoredRoutes,

  // Logic to run after authentication state is determined
  afterAuth(auth, req) {
    const url = req.nextUrl;
    const { userId, isPublicRoute } = auth;

    // --- Handle authenticated users ---
    if (userId) {
      // If user is authenticated and tries to access sign-in/sign-up, redirect them
      // (e.g., to the dashboard or a specified post-login destination)
      if (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up')) {
        const dashboardUrl = new URL('/dashboard', req.url); // Adjust '/dashboard' as needed
        return NextResponse.redirect(dashboardUrl);
      }
      // Allow access to any other route for authenticated users
      return NextResponse.next();
    }

    // --- Handle unauthenticated users ---
    // If the route is not public and the user is not authenticated,
    // redirect them to the sign-in page.
    if (!isPublicRoute) {
      // Preserve the original requested URL for redirection after login
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Allow access to public routes for unauthenticated users
    return NextResponse.next();
  }
});

// Configure the matcher to run the middleware on specific paths
export const config = {
  // Match all routes except those with extensions (likely static files)
  // and Next.js internal paths (_next)
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
