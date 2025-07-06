"use client";

import {
  convertGuestToUser,
  createGuestSession,
  getCurrentUser,
  GuestSessionManager
} from '@/lib/api/guest';
import { AuthContextType, GuestUserData, UnifiedUser } from '@/lib/auth/types';
import { useAuth, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache interface for better typing
interface UserCache {
  promise: Promise<GuestUserData> | null;
  lastFetchTime: number;
  userData: GuestUserData | null;
}

// Persistent cache manager for user data
class UserCacheManager {
  private static readonly CACHE_KEY = 'flow_builder_user_cache';
  private static readonly CACHE_DURATION = 60000; // 1 minute cache

  static getCachedUser(): { user: GuestUserData; timestamp: number } | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp < this.CACHE_DURATION) {
        return parsed;
      }

      // Cache expired, remove it
      this.clearCache();
      return null;
    } catch (error) {
      this.clearCache();
      return null;
    }
  }

  static setCachedUser(user: GuestUserData): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = {
        user,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      // Silently handle cache errors
    }
  }

  static clearCache(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      // Silently handle cache clear errors
    }
  }
}

const CACHE_DURATION = 30000; // 30 seconds for in-memory cache

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken: getClerkToken } = useAuth();
  const pathname = usePathname();

  const cacheRef = React.useRef<UserCache>({ promise: null, lastFetchTime: 0, userData: null });
  const sessionRecoveryAttempted = React.useRef(false);
  const apiCallsBlocked = React.useRef(false);
  const lastApiCallTime = React.useRef(0);
  const API_CALL_COOLDOWN = 5000;

  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async (sessionId?: string, forceRefresh = false): Promise<GuestUserData> => {
    const now = Date.now();
    const cache = cacheRef.current;

    if (!forceRefresh) {
      const cachedData = UserCacheManager.getCachedUser();
      if (cachedData) {
        cache.userData = cachedData.user;
        return cachedData.user;
      }
    }

    if (apiCallsBlocked.current || (now - lastApiCallTime.current) < API_CALL_COOLDOWN) {
      if (cache.userData) {
        return cache.userData;
      }
      throw new Error('API calls temporarily blocked to prevent spam');
    }

    if (cache.promise && !forceRefresh && (now - cache.lastFetchTime) < CACHE_DURATION) {
      return cache.promise;
    }

    lastApiCallTime.current = now;
    cache.promise = getCurrentUser(undefined, sessionId); // Pass sessionId as guestSessionId parameter
    cache.lastFetchTime = now;

    try {
      const result = await cache.promise;
      cache.userData = result;
      UserCacheManager.setCachedUser(result);
      return result;
    } catch (error) {
      cache.promise = null;
      apiCallsBlocked.current = true;
      setTimeout(() => {
        apiCallsBlocked.current = false;
      }, API_CALL_COOLDOWN * 2);
      throw error;
    }
  }, []);

  const loadGuestUser = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      const userData = await fetchCurrentUser(sessionId);

      if (userData.is_guest) {
        const unifiedUser: UnifiedUser = {
          id: userData.id,
          username: userData.username,
          isGuest: true,
          guest_expires_at: userData.guest_expires_at,
        };
        setUser(unifiedUser);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        try {
          const recoveredSession = await GuestSessionManager.attemptSessionRecovery();
          if (recoveredSession) {
            // Retry with recovered session
            const retryUserData = await getCurrentUser(undefined, recoveredSession.id);
            if (retryUserData.is_guest) {
              const unifiedUser: UnifiedUser = {
                id: retryUserData.id,
                username: retryUserData.username,
                isGuest: true,
                guest_expires_at: retryUserData.guest_expires_at,
              };
              setUser(unifiedUser);
              return; // Success, exit early
            }
          }
        } catch (recoveryErr) {
          // Session recovery failed, continue to fallback
        }
      }

      // If we reach here, authentication failed completely
      setUser(null);
      GuestSessionManager.clearSession();
      setError("Failed to authenticate guest session. Please try creating a new guest account.");
    }
  }, [fetchCurrentUser]);



  // Initialize authentication state
  useEffect(() => {
    if (!clerkLoaded) return;

    // Initialize guest session on mount
    GuestSessionManager.initializeSession();

    setIsLoading(true);
    let isMounted = true;

    if (clerkUser) {
      const unifiedUser: UnifiedUser = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        username: clerkUser.username ?? clerkUser.firstName ?? undefined,
        isGuest: false,
      };
      if (isMounted) {
        setUser(unifiedUser);
        setIsLoading(false);
      }
      sessionRecoveryAttempted.current = false;
      UserCacheManager.clearCache();
      return;
    }

    const cachedData = UserCacheManager.getCachedUser();
    if (cachedData && isMounted) {
      const unifiedUser: UnifiedUser = {
        id: cachedData.user.id,
        username: cachedData.user.username,
        isGuest: true,
        guest_expires_at: cachedData.user.guest_expires_at,
      };
      setUser(unifiedUser);
      setIsLoading(false);
      return;
    }

    // Validate session before using it
    if (GuestSessionManager.validateAndCleanSession()) {
      const sessionId = GuestSessionManager.getSessionId();

      if (sessionId) {
        const tempGuestUser: UnifiedUser = {
          id: `guest_${sessionId.substring(0, 8)}`,
          username: "Guest User",
          isGuest: true,
          guest_expires_at: GuestSessionManager.getSessionExpiry()?.toISOString(),
        };
        setUser(tempGuestUser);

        loadGuestUser(sessionId).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      }
    } else if (!sessionRecoveryAttempted.current) {
      sessionRecoveryAttempted.current = true;

      GuestSessionManager.attemptSessionRecovery()
        .then((recoveredSession) => {
          if (recoveredSession && isMounted) {
            const unifiedUser: UnifiedUser = {
              id: recoveredSession.id,
              username: recoveredSession.username,
              isGuest: true,
              guest_expires_at: recoveredSession.expiresAt,
            };
            setUser(unifiedUser);
          } else if (isMounted) {
            setUser(null);
          }
          if (isMounted) setIsLoading(false);
        })
        .catch(() => {
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
        });
    } else if (isMounted) {
      setUser(null);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [clerkUser, clerkLoaded, pathname, loadGuestUser]);

  // Cleanup cache and flags on unmount
  useEffect(() => {
    return () => {
      cacheRef.current.promise = null;
      cacheRef.current.userData = null;
      cacheRef.current.lastFetchTime = 0;
      sessionRecoveryAttempted.current = false;
      UserCacheManager.clearCache();
    };
  }, []);

  const createGuestAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await createGuestSession();
      GuestSessionManager.storeSession(session.session_id, session.expires_at);

      cacheRef.current.promise = null;
      cacheRef.current.userData = null;
      cacheRef.current.lastFetchTime = 0;
      sessionRecoveryAttempted.current = false;
      UserCacheManager.clearCache();

      await loadGuestUser(session.session_id);
    } catch (err: any) {
      console.error('Failed to create guest session:', err);
      if (err.response?.status === 403) {
        setError("You already have a guest account. Please sign up for a full account.");
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError("Cannot connect to backend. Please check if the API URL is configured correctly in Vercel environment variables.");
      } else {
        setError("Failed to create guest account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadGuestUser]);

  const convertToUser = useCallback(async (token: string) => {
    const sessionId = GuestSessionManager.getSessionId();

    if (!sessionId) {
      throw new Error("No guest session found");
    }

    try {
      setIsLoading(true);
      setError(null);

      const convertedUser = await convertGuestToUser(sessionId, token);

      // Clear guest session data after successful conversion
      GuestSessionManager.clearSession();
      cacheRef.current.promise = null;
      UserCacheManager.clearCache();

      // Return the converted user data for the caller to use
      return convertedUser;
    } catch (err: any) {
      // Don't set error state here, let the caller handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearGuestSession = useCallback(() => {
    GuestSessionManager.clearSession();
    cacheRef.current.promise = null;
    cacheRef.current.userData = null;
    cacheRef.current.lastFetchTime = 0;
    UserCacheManager.clearCache();
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (user?.isGuest) {
      const sessionId = GuestSessionManager.getSessionId();
      if (sessionId) {
        cacheRef.current.promise = null;
        await loadGuestUser(sessionId);
      }
    }
  }, [user?.isGuest, loadGuestUser]);

  // Periodic session validation for guest users
  useEffect(() => {
    if (user?.isGuest) {
      const interval = setInterval(() => {
        // Validate the session is still valid (not expired)
        if (!GuestSessionManager.validateAndCleanSession()) {
          // Session is expired or invalid, clear user and set error
          setUser(null);
          setError("Your guest session has expired. Please create a new guest account.");
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.isGuest]);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (clerkUser) {
      const token = await getClerkToken();
      return token ?? undefined;
    }
    return undefined;
  }, [clerkUser, getClerkToken]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (clerkUser) {
      const token = await getClerkToken();
      return token ? { "Authorization": `Bearer ${token}` } : {};
    }
    return {};
  }, [clerkUser, getClerkToken]);

  const isAuthenticated = !!user;

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    error,
    createGuestAccount,
    convertToUser,
    clearGuestSession,
    refreshUser,
    getToken,
    getAuthHeaders,
  }), [
    user,
    isLoading,
    isAuthenticated,
    error,
    createGuestAccount,
    convertToUser,
    clearGuestSession,
    refreshUser,
    getToken,
    getAuthHeaders,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUnifiedAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within an AuthProvider');
  }
  return context;
}

// Feature access control
export function useCanAccessFeature(feature: string): boolean {
  const { user } = useUnifiedAuth();
  
  if (!user) return false;
  
  const guestRestrictions = {
    'billing': false,
    'purchases': false,
    'workflows': true,
    'executions': true,
    'credentials': true,
  };

  if (!user.isGuest) return true;
  
  return guestRestrictions[feature as keyof typeof guestRestrictions] ?? true;
}
