import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Routes that support guest access (don't require full authentication)
const isGuestAccessibleRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workflow(.*)',
  '/credentials(.*)',
  '/guest-info(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request)) {
    return;
  }

  // For guest-accessible routes, be more permissive
  if (isGuestAccessibleRoute(request)) {
    // Check for guest session header (for API requests)
    const guestSessionId = request.headers.get('X-Guest-Session-ID');

    // Check for guest session cookie (for page requests)
    const guestSessionCookie = request.cookies.get('guest_session_id')?.value;

    // If there's a guest session (either header or cookie), allow access
    if (guestSessionId || guestSessionCookie) {
      return;
    }

    // For page requests (not API calls), allow access and let client-side handle validation
    const isApiRequest = request.url.includes('/api/') ||
                        request.headers.get('content-type')?.includes('application/json') ||
                        request.headers.get('x-requested-with');

    if (!isApiRequest) {
      // Allow page requests to proceed - client-side will handle guest session validation
      return;
    }
  }
  await auth.protect();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ],
};