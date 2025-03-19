import { authMiddleware } from "@clerk/nextjs/server";

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
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
