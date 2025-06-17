/**
 * Shared types for unified authentication
 * Can be imported by both client and server components
 */

export interface UserBalance {
  credits: number;
}

export interface UnifiedUser {
  id: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  isGuest: boolean;
  token?: string;
  guestSessionId?: string;
  guest_expires_at?: string;
}

export interface GuestUserData {
  id: string;
  username: string;
  is_guest: boolean;
  guest_expires_at?: string;
}

export interface GuestSession {
  session_id: string;
  expires_at: string;
}

export interface AuthContextType {
  user: UnifiedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Guest-specific actions
  createGuestAccount: () => Promise<void>;
  convertToUser: (token: string) => Promise<void>;
  clearGuestSession: () => void;
  refreshUser: () => Promise<void>;

  // Auth functions
  getToken: () => Promise<string | undefined>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}
