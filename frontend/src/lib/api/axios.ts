import axios from "axios";
import { GuestSessionManager } from "./guest";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to automatically include guest session headers
api.interceptors.request.use((config) => {
  // Check for guest session if no authorization header is present
  if (!config.headers.Authorization && !config.headers["X-Guest-Session-ID"]) {
    const guestSessionId = GuestSessionManager.getSessionId();
    if (guestSessionId) {
      config.headers["X-Guest-Session-ID"] = guestSessionId;
    }
  }
  return config;
});

export const getAuthHeaders = (token: string) => {
  if (!token) {
    throw new Error("Token is required for authentication");
  }
  return { Authorization: `Bearer ${token}` };
};

export const getGuestHeaders = (sessionId?: string) => {
  const guestSessionId = sessionId ?? GuestSessionManager.getSessionId();
  if (!guestSessionId) {
    throw new Error("Guest session ID is required");
  }
  return { "X-Guest-Session-ID": guestSessionId };
};

export const getAuthOrGuestHeaders = (token?: string, guestSessionId?: string) => {
  if (token) {
    return getAuthHeaders(token);
  }
  return getGuestHeaders(guestSessionId);
};
