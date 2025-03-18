/**
 * Next.js Middleware
 * 
 * Provides HTTP header optimization, edge routing, and performance improvements
 */
import { NextResponse, NextRequest } from 'next/server';
import { createCacheControlHeader } from './src/lib/optimization/rendering-optimization';

/**
 * Middleware function
 * 
 * @param request Incoming request
 * @returns Response with optimized headers
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // Determine optimal Cache-Control header based on path
  const { pathname } = request.nextUrl;
  let cacheControl: string;
  
  // Static assets get long cache times
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/static/')) {
    cacheControl = createCacheControlHeader({
      visibility: 'public',
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 31536000
    });
  }
  // Image assets get medium cache times
  else if (pathname.startsWith('/images/') || pathname.match(/\.(jpe?g|png|gif|svg|webp|avif)$/i)) {
    cacheControl = createCacheControlHeader({
      visibility: 'public',
      maxAge: 86400, // 1 day
      staleWhileRevalidate: 604800 // 1 week
    });
  }
  // API routes and auth endpoints should not be cached
  else if (pathname.startsWith('/api/') || 
           pathname.startsWith('/auth/') || 
           pathname.includes('/sign-in') ||
           pathname.includes('/sign-up')) {
    cacheControl = createCacheControlHeader({
      visibility: 'private',
      noCache: true,
      noStore: true,
      mustRevalidate: true
    });
  }
  // Font files get long cache times
  else if (pathname.match(/\.(woff2?|ttf|otf|eot)$/i)) {
    cacheControl = createCacheControlHeader({
      visibility: 'public',
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 31536000
    });
  }
  // Default for most pages - moderate caching
  else {
    cacheControl = createCacheControlHeader({
      visibility: 'public',
      maxAge: 60, // 1 minute
      staleWhileRevalidate: 300 // 5 minutes
    });
  }
  
  // Add Cache-Control header
  response.headers.set('Cache-Control', cacheControl);
  
  // Add Server-Timing header for monitoring in development
  if (process.env.NODE_ENV === 'development') {
    const startTime = Date.now();
    response.headers.set('Server-Timing', `Middleware;dur=${Date.now() - startTime}`);
  }
  
  // Detect mobile clients and add to request headers
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i);
  response.headers.set('X-Is-Mobile', isMobile ? '1' : '0');
  
  // Add preload headers for critical resources (fonts, CSS)
  if (!pathname.includes('/_next/') && !pathname.includes('/api/')) {
    response.headers.set('Link', '</fonts/inter.woff2>; rel=preload; as=font; crossorigin=anonymous, </fonts/montserrat.woff2>; rel=preload; as=font; crossorigin=anonymous');
  }
  
  return response;
}

/**
 * Configure middleware to run only for specific paths
 */
export const config = {
  matcher: [
    // Apply to all routes except Next.js specific routes and server-side generated resources
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
