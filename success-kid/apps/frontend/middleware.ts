import { authMiddleware, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default authMiddleware({
  // Array of public routes that don't require authentication
  publicRoutes: [
    "/",
    "/api/health", 
    "/api/public(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/sso-callback(.*)",
    "/forgot-password(.*)",
    "/reset-password(.*)",
    "/blog/(.*)",
    "/about",
    "/privacy-policy",
    "/terms-of-service",
    "/contact",
    // Add other public routes as needed
  ],
  
  // Array of routes to be ignored by the authentication middleware
  ignoredRoutes: [
    "/api/webhook(.*)",
    "/_next(.*)",
    "/favicon.ico",
    "/static/(.*)",
    "/images/(.*)",
  ],
  
  // Handle redirects for authenticated users
  async afterAuth(auth, req, evt) {
    // Get current URL path
    const url = new URL(req.nextUrl);
    const path = url.pathname;
    
    // If on public route and authenticated, don't redirect
    if (auth.isPublicRoute) {
      // Special case: redirect from sign-in and sign-up if already authenticated
      if ((path.startsWith('/sign-in') || path.startsWith('/sign-up')) && auth.userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      
      return NextResponse.next();
    }
    
    // For protected routes, check if user is authenticated
    if (!auth.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    // Check if the user has completed onboarding
    try {
      const user = await clerkClient.users.getUser(auth.userId);
      const hasOnboarded = user.publicMetadata.onboarded === true;
      
      // If the user hasn't onboarded and is not already on the onboarding page, redirect to onboarding
      if (!hasOnboarded && !path.includes('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
    
    // For admin routes, check if user has the right role
    if (path.startsWith('/admin')) {
      try {
        const user = await clerkClient.users.getUser(auth.userId);
        const isAdmin = user.publicMetadata.role === 'admin';
        
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    
    // Continue with the request
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
