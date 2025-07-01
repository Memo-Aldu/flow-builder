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
      // Validate guest session by calling the API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/current`, {
          headers: {
            "X-Guest-Session-ID": guestSessionId,
          },
        });

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
        console.error("Failed to validate guest session:", error);
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
