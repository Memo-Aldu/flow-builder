import { api } from "./axios";

export interface GuestSession {
  session_id: string;
  user_id: string;
  credits: number;
  expires_at: string;
}

export interface GuestSessionInfo {
  user_id: string;
  username: string;
  credits: number;
  expires_at: string;
  is_guest: boolean;
}

export interface ConvertGuestResponse {
  user_id: string;
  clerk_id: string;
  email: string;
  username: string;
  credits: number;
  is_guest: boolean;
}

/**
 * Create a new guest session
 */
export async function createGuestSession(): Promise<GuestSession> {
  // Create browser fingerprint for guest session
  const fingerprint = await GuestSessionManager.createBrowserFingerprint();
  const response = await api.post("/api/v1/guest/create-session", { fingerprint });
  return response.data;
}

/**
 * Get guest session information
 */
export async function getGuestSession(sessionId: string): Promise<GuestSessionInfo> {
  const response = await api.get(`/api/v1/guest/session/${sessionId}`);
  return response.data;
}

/**
 * Convert guest user to regular user after signup
 */
export async function convertGuestToUser(
  guestSessionId: string,
  token: string
): Promise<ConvertGuestResponse> {
  const response = await api.post(
    "/api/v1/guest/convert-to-user",
    { guest_session_id: guestSessionId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Get current user (supports both guest and authenticated users)
 */
export async function getCurrentUser(token?: string, guestSessionId?: string) {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (guestSessionId) {
    headers["X-Guest-Session-ID"] = guestSessionId;
  } else {
    const autoSessionId = GuestSessionManager.getSessionId();
    if (autoSessionId) {
      // Session found, will be handled by interceptor
    }
  }

  try {
    const response = await api.get("/api/v1/users/current", { headers });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

// Guest session management utilities
export class GuestSessionManager {
  private static readonly STORAGE_KEY = "guest_session_id";
  private static readonly EXPIRY_KEY = "guest_session_expiry";
  private static readonly LAST_VALIDATED_KEY = "guest_session_last_validated";


  /**
   * Store guest session in localStorage and cookies
   */
  static storeSession(sessionId: string, expiresAt: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, sessionId);
      localStorage.setItem(this.EXPIRY_KEY, expiresAt);
      localStorage.setItem(this.LAST_VALIDATED_KEY, Date.now().toString());

      // Also set as cookie for middleware detection
      const expiryDate = new Date(expiresAt);
      document.cookie = `guest_session_id=${sessionId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    }
  }

  /**
   * Get stored guest session ID with automatic recovery
   */
  static getSessionId(): string | null {
    if (typeof window === "undefined") return null;

    // 1️⃣  Already in localStorage? – quick exit
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return stored;

    // 2️⃣  Try cookie
    const match = document.cookie.match(/guest_session_id=([^;]+)/);
    if (!match) return null;

    const sessionId = match[1];
    localStorage.setItem(this.STORAGE_KEY, sessionId);

    return sessionId;
  }


  /**
   * Attempt to recover guest session from backend using browser fingerprint
   * This is secure because it only works if the session exists and hasn't expired
   */
  static async attemptSessionRecovery(): Promise<{ id: string; username: string; credits: number; expiresAt: string } | null> {
    if (typeof window === "undefined") return null;

    try {
      // Create a simple browser fingerprint
      const fingerprint = await this.createBrowserFingerprint();
      const response = await api.post("/api/v1/guest/recover", { fingerprint });

      if (response.status === 200 && response.data) {
        const userData = response.data;
        if (userData.session_id && userData.expires_at) {
          this.storeSession(userData.session_id, userData.expires_at);
          return {
            id: userData.session_id,
            username: userData.username ?? 'Guest',
            credits: userData.credits ?? 0,
            expiresAt: userData.expires_at,
          };
        }
      }
    } catch (error: any) {
      // Silently handle errors - 404s are expected when no session exists
      // Other errors are also handled gracefully by returning null
    }

    return null;
  }

  /**
   * Create a simple browser fingerprint for session recovery
   * This is not for security, just for identifying the same browser
   */
  static async createBrowserFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      (navigator as any).userAgentData?.platform ?? navigator.platform ?? 'unknown',
    ];

    // Create a simple hash
    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Clear guest session from localStorage and cookies
   */
  static clearSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.EXPIRY_KEY);
      localStorage.removeItem(this.LAST_VALIDATED_KEY);

      // Also clear cookie
      document.cookie = "guest_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }

  /**
   * Validate and clean up corrupted session data
   */
  static validateAndCleanSession(): boolean {
    if (typeof window === "undefined") return false;

    try {
      const sessionId = this.getSessionId();
      const expiry = this.getSessionExpiry();

      // If we have a session ID but no valid expiry, clear everything
      if (sessionId && !expiry) {
        console.warn("Guest session found without expiry, clearing session");
        this.clearSession();
        return false;
      }

      // If expiry is in the past, clear everything
      if (expiry && expiry.getTime() < Date.now()) {
        console.warn("Guest session expired, clearing session");
        this.clearSession();
        return false;
      }

      // If we have both session ID and valid expiry, session is valid
      const isValid = sessionId !== null && expiry !== null;

      if (!isValid) {
        console.warn("Guest session validation failed, clearing session");
        this.clearSession();
      }

      return isValid;
    } catch (error) {
      // Any error during validation, clear everything
      console.error("Error validating guest session:", error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Initialize and clean up any corrupted data on app startup
   */
  static initializeSession(): void {
    if (typeof window === "undefined") return;

    try {
      // Validate current session data
      this.validateAndCleanSession();
    } catch (error) {
      // If any error occurs, clear all session data
      this.clearSession();
    }
  }

  /**
   * Check if user has an active guest session
   */
  static hasActiveSession(): boolean {
    return this.validateAndCleanSession();
  }

  /**
   * Get session expiry date
   */
  static getSessionExpiry(): Date | null {
    if (typeof window === "undefined") return null;

    const expiry = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiry) return null;

    try {
      const date = new Date(expiry);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Invalid date, clear the corrupted data
        localStorage.removeItem(this.EXPIRY_KEY);
        return null;
      }
      return date;
    } catch (error) {
      // Error parsing date, clear the corrupted data
      localStorage.removeItem(this.EXPIRY_KEY);
      return null;
    }
  }

  /**
   * Get days remaining in guest session
   */
  static getDaysRemaining(): number {
    const expiry = this.getSessionExpiry();
    if (!expiry) return 0;
    
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
}
