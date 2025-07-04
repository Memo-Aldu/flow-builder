import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { UnifiedUser } from "./types";

/**
 * Server-side unified authentication
 * Works in server components and API routes
 * Returns user data for both Clerk and guest users
 */
export async function getUnifiedAuth(): Promise<UnifiedUser | null> {
  try {
    // First try Clerk authentication
    const { userId, getToken } = await auth();
    
    if (userId) {
      // User is authenticated with Clerk
      const token = await getToken();
      return {
        id: userId,
        isGuest: false,
        token: token ?? undefined,
      };
    }

    // Try guest authentication
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");
    const guestSessionId = headersList.get("X-Guest-Session-ID") ??
                          cookieHeader?.match(/guest_session_id=([^;]+)/)?.[1];

    if (guestSessionId) {
      // In serverless environments (Vercel), server-side API calls can be unreliable
      // For guest sessions, we'll trust the cookie presence and defer full validation to client-side
      try {
        // Try to validate with a very short timeout to avoid blocking SSR
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/current`, {
          headers: {
            "X-Guest-Session-ID": guestSessionId,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const userData = await response.json();

          if (userData.is_guest) {
            return {
              id: userData.id,
              username: userData.username,
              isGuest: true,
              guestSessionId,
              token: undefined,
              guest_expires_at: userData.guest_expires_at,
            };
          }
        }
      } catch (error) {
        // In serverless environments, API validation can fail due to cold starts
        // Fall back to trusting the cookie for server-side rendering
        console.warn("Server-side guest session validation failed, falling back to cookie trust:", error instanceof Error ? error.message : String(error));

        // Extract expiry from cookie if available for basic validation
        const cookieHeader = (await headers()).get("cookie");
        const expiryMatch = cookieHeader?.match(/guest_session_expiry=([^;]+)/);
        const expiryDate = expiryMatch ? expiryMatch[1] : undefined;

        // Basic expiry check
        if (expiryDate) {
          const expiry = new Date(expiryDate);
          if (expiry.getTime() < Date.now()) {
            // Session is expired
            return null;
          }
        }

        // Return a basic guest user object for server-side rendering
        // Client-side will handle full validation
        return {
          id: `guest_${guestSessionId.substring(0, 8)}`,
          username: "Guest User",
          isGuest: true,
          guestSessionId,
          token: undefined,
          guest_expires_at: expiryDate,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Unified auth error:", error);
    return null;
  }
}

/**
 * Get authentication headers for API calls
 * Works for both Clerk and guest users
 */
export async function getUnifiedAuthHeaders(): Promise<Record<string, string>> {
  const user = await getUnifiedAuth();
  
  if (!user) {
    return {};
  }

  if (user.isGuest && user.guestSessionId) {
    return {
      "X-Guest-Session-ID": user.guestSessionId,
    };
  }

  if (!user.isGuest && user.token) {
    return {
      "Authorization": `Bearer ${user.token}`,
    };
  }

  return {};
}

/**
 * Server-side function to get user token
 * Returns Clerk token for authenticated users, undefined for guests
 */
export async function getUnifiedToken(): Promise<string | undefined> {
  const user = await getUnifiedAuth();
  return user?.token;
}

/**
 * Check if current user can access a feature
 * Server-side version
 */
export async function canAccessFeature(feature: string): Promise<boolean> {
  const user = await getUnifiedAuth();
  
  if (!user) return false;
  
  // Define feature restrictions for guest users
  const guestRestrictions = {
    'billing': false,        // Guests can't access billing
    'purchases': false,      // Guests can't make purchases
    'workflows': true,       // Guests can create workflows
    'executions': true,      // Guests can run workflows
    'credentials': true,     // Guests can store credentials
  };

  if (!user.isGuest) return true; // Authenticated users have full access
  
  return guestRestrictions[feature as keyof typeof guestRestrictions] ?? true;
}
