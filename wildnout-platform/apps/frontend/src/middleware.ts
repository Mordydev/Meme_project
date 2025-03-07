import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',                     // Landing page
    '/api/webhook/clerk',     // Clerk webhooks
    '/api/public(.*)',        // Public API routes
    '/terms',                 // Legal pages
    '/privacy',
    '/battle(.*)'             // Public battle viewing
  ],
  ignoredRoutes: [
    '/api/webhook(.*)',      // Other webhooks
    '/_next/static/(.*)',    // Static assets
    '/favicon.ico',
    '/((?!api|trpc).*)',     // Ignore routes that don't start with api or trpc
  ]
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}