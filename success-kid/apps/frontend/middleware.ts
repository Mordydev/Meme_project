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
    // Add other public routes as needed
  ],
  
  // Array of routes to be ignored by the authentication middleware
  ignoredRoutes: [
    "/api/webhook(.*)",
    "/_next(.*)",
    "/favicon.ico",
  ],
  
  // Handle redirects for authenticated users
  async afterAuth(auth, req) {
    // Handle middleware logic only for authenticated requests
    if (auth.isPublicRoute || !auth.userId) {
      return NextResponse.next();
    }
    
    const url = new URL(req.nextUrl);
    
    // Check if the user has completed onboarding
    try {
      const user = await clerkClient.users.getUser(auth.userId);
      const hasOnboarded = user.publicMetadata.onboarded === true;
      
      // If the user hasn't onboarded and is not already on the onboarding page, redirect to onboarding
      if (!hasOnboarded && !url.pathname.includes('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
    
    // Continue with the request
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
